import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const RAILWAY = "https://pankosmia.up.qombi.com";
const MAIN_SITE = "https://pankosmia.netlify.app";
const LOCAL_HOST = "localhost:5179";

const apiPaths = [
  "/auth",
  "/me",
  "/net",
  "/burrito",
  "/git",
  "/gitea",
  "/navigation",
  "/app-state",
  "/i18n",
  "/settings",
  "/notifications",
  "/user-resources",
  "/user-languages",
  "/content-utils",
];

const staticPaths = [
  "/webfonts",
  "/app-resources",
  "/templates",
  "/client-interfaces",
  "/list-clients",
  "/clients/main",
];

function makeRailwayProxy() {
  return {
    target: RAILWAY,
    changeOrigin: true,
    secure: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader("X-Forwarded-Host", LOCAL_HOST);
        proxyReq.setHeader("X-Forwarded-Proto", "http");
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    strictPort: true,
    host: true,
    cors: true,
    proxy: {
      ...Object.fromEntries(apiPaths.map((p) => [p, makeRailwayProxy()])),
      ...Object.fromEntries(
        staticPaths.map((p) => [
          p,
          { target: MAIN_SITE, changeOrigin: true, secure: true },
        ]),
      ),
    },
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: true,
  },
  base: "/",
});
