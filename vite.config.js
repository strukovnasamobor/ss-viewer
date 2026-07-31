import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-512-maskable.png",
        "i18n/en.json",
        "i18n/hr.json",
      ],
      manifest: {
        id: "com.strukovnasamobor.ssviewer_ucenici.twa",
        name: "SS Viewer",
        short_name: "SS Viewer",
        theme_color: "#004080",
        background_color: "#004080",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
    }),
  ],
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Set to true in production
        drop_debugger: true, // Set to true in production
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});