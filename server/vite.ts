import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const vite = express.Router();

// Create Vite server in middleware mode and configure server-side rendering
// in development. In production, this will serve the client-side build.
if (process.env.NODE_ENV === "development") {
  const viteServer = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  vite.use(viteServer.middlewares);

  vite.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(
        path.resolve(__dirname, "../../client/index.html"),
        "utf-8"
      );
      template = await viteServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  const distPath = path.resolve(__dirname, "../../dist/public");
  vite.use(express.static(distPath));
  vite.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
