import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const pwaConfig = {
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
  manifest: {
    name: "Smart Expense Tracker",
    short_name: "ExpenseTracker",
    description: "Track daily expenses, income, and shared expenses with friends.",
    theme_color: "#2eb872",
    background_color: "#f5f7fa",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/~oauth/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-cache",
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "gstatic-fonts-cache",
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let pwaPlugin: unknown = null;

  try {
    const { VitePWA } = await import("vite-plugin-pwa");
    pwaPlugin = VitePWA(pwaConfig);
  } catch {
    console.warn("[vite] vite-plugin-pwa not found, skipping PWA plugin for this build.");
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger(), pwaPlugin].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
