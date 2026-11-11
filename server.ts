import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

import statusRouter from "./server/routes/status";
import openDataRouter from "./server/routes/openData";
import envRouter from "./server/routes/environment";
import modelRouter from "./server/routes/model";
import mapsRouter from "./server/routes/maps";
import earthEngineRouter from "./server/routes/earthEngine";
import q1ResearchSuiteRouter from "./server/routes/q1ResearchSuite";
import q1FrontiersSuiteRouter from "./server/routes/q1FrontiersSuite";
import audioSpeechRouter from "./server/routes/audioSpeech";
import geminiVisionRouter from "./server/routes/geminiVision";
import workspaceSyncRouter from "./server/routes/workspaceSync";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS Middleware nativo para Iframe y MapLibre Web Workers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, If-None-Match, Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, ETag, X-Tile-Cache");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Health check guaranteed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve static files from public folder
  app.use(express.static(path.resolve(process.cwd(), "public")));

  // API Routes FIRST
  app.use(statusRouter);
  app.use(openDataRouter);
  app.use(envRouter);
  app.use(modelRouter);
  app.use(mapsRouter);
  app.use(earthEngineRouter);
  app.use(q1ResearchSuiteRouter);
  app.use(q1FrontiersSuiteRouter);
  app.use(audioSpeechRouter);
  app.use(geminiVisionRouter);
  app.use(workspaceSyncRouter);

  const distPath = path.resolve(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" && fs.existsSync(path.join(distPath, "index.html"));

  if (isProduction) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vitePromise = createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Server Error] Port ${PORT} is already in use.`);
    } else {
      console.error("[Server Error]", err);
    }
  });
}

process.on("uncaughtException", (err: any) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

startServer().catch((err) => {
  console.error("FATAL: Failed to start server:", err);
});
