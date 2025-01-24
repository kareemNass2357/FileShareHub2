import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import session from "express-session";
import { requireAuth } from "./middleware";
import MemoryStore from "memorystore";
import { db } from "@db";
import { notes, insertNoteSchema } from "@db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MUSIC_DIR = path.join(UPLOAD_DIR, "music");
const SESSION_SECRET = process.env.SESSION_SECRET || "development_secret";
const AUTH_PASSWORD = "123456"; //Hardcoded for example, should be environment variable

// Supported audio MIME types
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',  // .mp3
  'audio/wav',   // .wav
  'audio/ogg',   // .ogg
  'audio/aac',   // .aac
  'audio/midi',  // .midi
  'audio/x-m4a', // .m4a
  'audio/webm',  // .weba
];

// Ensure uploads and music directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// In-memory map to store share links (in production, this should be in a database)
const shareLinks = new Map<string, string>();

// Storage configuration for general files
const fileStorage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Storage configuration for music files
const musicStorage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, MUSIC_DIR);
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Music file filter
const musicFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (SUPPORTED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
  }
};

const upload = multer({ storage: fileStorage });
const musicUpload = multer({ 
  storage: musicStorage,
  fileFilter: musicFileFilter
});

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

  // Check if user is authenticated middleware
  const requireMusicAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.authenticated) {
      next();
    } else {
      res.status(401).send("Unauthorized");
    }
  };

  // Music authentication endpoints
  app.post("/api/music/login", (req: Request, res: Response) => {
    const { password } = req.body;

    if (password === AUTH_PASSWORD) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.post("/api/music/logout", (req: Request, res: Response) => {
    req.session.authenticated = false;
    res.json({ success: true });
  });

  // Get authentication status
  app.get("/api/music/auth-status", (req: Request, res: Response) => {
    res.json({ isAuthenticated: !!req.session.authenticated });
  });

  // Protect music endpoints
  app.get("/api/music", requireMusicAuth, (_req: Request, res: Response) => {
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
  app.get("/api/music/:filename", requireMusicAuth, (req: Request, res: Response) => {
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

  // Upload music file endpoint
  app.post("/api/music/upload", requireMusicAuth, musicUpload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    res.json({ success: true, filename: req.file.filename });
  });

  // Authentication endpoint
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { password } = req.body;

    if (password === AUTH_PASSWORD) {
      req.session.authenticated = true;
      req.session.save((err) => {
        if (err) {
          res.status(500).json({ success: false, message: "Failed to save session" });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.authenticated = false;
    res.json({ success: true });
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

  // General file upload endpoint
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

  // Notes endpoints
  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoteSchema.parse({
        content: req.body.content,
      });

      const [createdNote] = await db.insert(notes).values(validatedData).returning();

      res.json({
        success: true,
        note: createdNote,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}