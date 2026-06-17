import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer — writes dist/stats.html after every `vite build`.
    // Open it to see exactly what is inside each chunk (gzip + brotli sizes).
    visualizer({
      filename: "dist/stats.html",
      template: "treemap",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    // Raise the warning threshold; real code-splitting now comes from
    // route-level React.lazy() (see components/routes/Router.jsx), which lets
    // Rollup split each route + its vendor deps into its own chunk automatically.
    //
    // NOTE: we deliberately do NOT hand-write a manualChunks() vendor grouping.
    // Forcing interdependent packages (e.g. jspdf/canvg/dompurify/html2canvas)
    // into separate chunks broke their initialization order and produced
    // "Class extends value undefined is not a constructor or null" at runtime.
    // Rollup's default, dependency-aware chunking keeps that order correct.
    chunkSizeWarningLimit: 1500,
  },
});
