import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import session from "express-session";
import { requireAuth } from "./middleware";
import MemoryStore from "memorystore";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MUSIC_DIR = path.join(UPLOAD_DIR, "music");
const SESSION_SECRET = process.env.SESSION_SECRET || "development_secret";
const DOWNLOADS_PASSWORD = process.env.DOWNLOADS_PASSWORD;

if (!DOWNLOADS_PASSWORD) {
  throw new Error("DOWNLOADS_PASSWORD environment variable must be set");
}

// Ensure uploads and music directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// In-memory map to store share links (in production, this should be in a database)
const shareLinks = new Map<string, string>();

const fileStorage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // If it's a music file, store in music directory
    if (file.mimetype.startsWith('audio/')) {
      cb(null, MUSIC_DIR);
    } else {
      cb(null, UPLOAD_DIR);
    }
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: fileStorage });

function generateShareId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function registerRoutes(app: Express): Server {
  // Session middleware setup
  const MemorySessionStore = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemorySessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      secret: SESSION_SECRET,
      saveUninitialized: false,
    })
  );

  // Get music files list
  app.get("/api/music", (_req: Request, res: Response) => {
    fs.readdir(MUSIC_DIR, (err, files) => {
      if (err) {
        return res.status(500).send("Error reading music directory");
      }

      const musicFiles = files.map(filename => {
        const stats = fs.statSync(path.join(MUSIC_DIR, filename));
        return {
          name: filename,
          size: stats.size,
          uploadDate: stats.mtime,
        };
      });

      res.json(musicFiles);
    });
  });

  // Stream music file
  app.get("/api/music/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(MUSIC_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Authentication endpoint
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { password } = req.body;

    if (password === DOWNLOADS_PASSWORD) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Protected file listing endpoint
  app.get("/api/files", requireAuth, (_req: Request, res: Response) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
      if (err) {
        return res.status(500).send("Error reading files directory");
      }

      const fileList = files.map(filename => {
        const stats = fs.statSync(path.join(UPLOAD_DIR, filename));
        const shareId = Array.from(shareLinks.entries())
          .find(([_, fname]) => fname === filename)?.[0];

        return {
          name: filename,
          size: stats.size,
          uploadDate: stats.mtime,
          shareId,
        };
      });

      res.json(fileList);
    });
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    res.json({ success: true, filename: req.file.filename });
  });

  // Create share link
  app.post("/api/share/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).send("File not found");
    }

    // Check if file already has a share link
    const existingShareId = Array.from(shareLinks.entries())
      .find(([_, fname]) => fname === filename)?.[0];

    if (existingShareId) {
      return res.json({ shareId: existingShareId });
    }

    // Generate new share link
    const shareId = generateShareId();
    shareLinks.set(shareId, filename);
    res.json({ shareId });
  });

  // Handle shared file download
  app.get("/share/:shareId", (req: Request, res: Response) => {
    const shareId = req.params.shareId;
    const filename = shareLinks.get(shareId);

    if (!filename) {
      return res.status(404).send("Share link not found or expired");
    }

    const filepath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filepath)) {
      shareLinks.delete(shareId); // Clean up invalid share link
      return res.status(404).send("File not found");
    }

    res.download(filepath, filename.substring(filename.indexOf('-') + 1));
  });

  // Preview file endpoint
  app.get("/api/preview/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).send("File not found");
    }

    // For images and PDFs, stream the file directly
    if (filename.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) {
      res.sendFile(filepath);
    }
    // For text files, read and send the content
    else if (filename.match(/\.(txt|md|json|csv)$/i)) {
      fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
          return res.status(500).send("Error reading file");
        }
        res.send(data);
      });
    } else {
      res.status(415).send("File type not supported for preview");
    }
  });

  // Download file endpoint
  app.get("/api/download/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).send("File not found");
    }

    res.download(filepath);
  });

  const httpServer = createServer(app);
  return httpServer;
}