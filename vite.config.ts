import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Only include Replit plugins in development and when REPL_ID is present
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // Dynamic import to avoid build errors on Vercel
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ).catch(() => null),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ).catch(() => null),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ).catch(() => null),
        ].filter(Boolean)
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
