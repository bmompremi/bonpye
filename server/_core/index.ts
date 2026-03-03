import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { ENV } from "./env";
import { SignJWT } from "jose";

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
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // ── Google OAuth ────────────────────────────────────────────────────────────
  app.get("/api/auth/google", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const dynamicRedirectUri = `${proto}://${host}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: dynamicRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }
    try {
      const proto = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const dynamicRedirectUri = `${proto}://${host}/api/auth/google/callback`;
      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: dynamicRedirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json() as any;
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      // Get user profile
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await profileRes.json() as any;

      // Upsert user in DB
      const { upsertUser, getUserByOpenId } = await import("../db");
      const openId = `google-${googleUser.id}`;
      const emailHandle = googleUser.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ?? "player";

      await upsertUser({
        openId,
        name: googleUser.name ?? null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
        handle: emailHandle,
        avatarUrl: googleUser.picture ?? null,
      });

      const user = await getUserByOpenId(openId);
      if (!user) throw new Error("Failed to create user");

      // Create JWT session
      const secret = new TextEncoder().encode(ENV.cookieSecret || "bonpye-secret");
      const token = await new SignJWT({
        openId,
        appId: ENV.appId || "bonpye",
        name: googleUser.name || emailHandle,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);

      const COOKIE_NAME = "bonpye_session";
      const maxAge = 30 * 24 * 60 * 60;
      const cookieParts = [
        `${COOKIE_NAME}=${token}`,
        `Max-Age=${maxAge}`,
        `Path=/`,
        `SameSite=Lax`,
        `HttpOnly`,
      ];
      if (ENV.isProduction) cookieParts.push(`Secure`);
      const cookieHeader = cookieParts.join("; ");
      res.setHeader("Set-Cookie", cookieHeader);
      res.redirect("/feed");
    } catch (err: any) {
      console.error("[OAuth] Google callback error:", err);
      res.redirect("/?error=oauth_failed");
    }
  });
  // ────────────────────────────────────────────────────────────────────────────


  // File upload endpoint for videos (using multer instead of base64)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB max
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

      // Upload to storage (S3/local)
      const ext = file.originalname.split(".").pop() || "mp4";
      const key = `videos/${context.user.id}/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);

      console.log(`[Upload] Video uploaded: ${key} by user ${context.user.id} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      res.json({ url, success: true });
    } catch (error: any) {
      console.error("[Upload] Video upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });
  // Serve local uploads as static files (iOS-safe headers)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "7d",
    immutable: false,
    setHeaders(res, filePath) {
      // Allow cross-origin image loading (required for canvas / iOS WebKit)
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      // Ensure inline display (not download)
      res.setHeader("Content-Disposition", "inline");
      // Force correct MIME type for common image extensions so Safari doesn't guess
      const ext = filePath.split(".").pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
      };
      if (ext && mimeMap[ext]) {
        res.setHeader("Content-Type", mimeMap[ext]);
      }
    },
  }));

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
