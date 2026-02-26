import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { sdk } from "./sdk";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Check and suspend expired unverified users
async function checkExpiredVerifications() {
  try {
    const db = await import('../db');
    const suspendedCount = await db.suspendExpiredUsers();
    if (suspendedCount > 0) {
      console.log(`[Verification] Suspended ${suspendedCount} users for failing to verify within 24 hours`);
      
      // Notify owner about suspensions
      const { notifyOwner } = await import('./notification');
      await notifyOwner({
        title: '⚠️ Users Suspended',
        content: `${suspendedCount} user(s) have been suspended for failing to verify their identity within 24 hours.`
      });
    }
  } catch (error) {
    console.error('[Verification] Error checking expired verifications:', error);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // File upload endpoint for videos (using multer instead of base64)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max
    },
  });

  app.post("/api/upload/video", upload.single("video"), async (req, res) => {
    try {
      // Get user from context using cookies
      const context = await createContext({ req, res } as any);
      
      if (!context.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to S3
      const ext = file.originalname.split(".").pop() || "mp4";
      const key = `uploads/${context.user.id}/videos/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);

      console.log(`[Upload] Video uploaded: ${key} by user ${context.user.id} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      res.json({ url, success: true });
    } catch (error: any) {
      console.error("[Upload] Video upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Run verification check immediately on startup
    checkExpiredVerifications();
    
    // Then run every hour
    setInterval(checkExpiredVerifications, 60 * 60 * 1000);
  });
}

startServer().catch(console.error);
