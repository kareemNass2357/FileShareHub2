import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export function registerRoutes(app: Express): Server {
  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    res.json({ success: true, filename: req.file.filename });
  });

  // Get list of files
  app.get("/api/files", (_req: Request, res: Response) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
      if (err) {
        return res.status(500).send("Error reading files directory");
      }

      const fileList = files.map(filename => {
        const stats = fs.statSync(path.join(UPLOAD_DIR, filename));
        return {
          name: filename,
          size: stats.size,
          uploadDate: stats.mtime,
        };
      });

      res.json(fileList);
    });
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