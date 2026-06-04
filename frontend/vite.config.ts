import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      // Proxy API to local backend so Android/LAN clients work without localhost in browser.
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // Proxy uploaded assets (team logos/player photos) served by Spring static handler.
      "/uploads": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // Proxy FotMob images to avoid CORS issues (used by PDF export).
      "/fotmob-img": {
        target: "https://images.fotmob.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fotmob-img/, ""),
      },
    },
  },
});
