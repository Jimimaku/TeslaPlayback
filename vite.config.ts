/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsInlineLimit(filePath: string) {
      return filePath.includes(".mp4");
    },
  },
  plugins: [
    react(),
    {
      name: "CrossOriginIsolationPlugin",
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        });
      },
    },
  ],
  test: {
    environment: "happy-dom",
  },
});
