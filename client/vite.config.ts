import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, "..");
  const env = loadEnv(mode, repoRoot, "");
  const apiPort = env.PORT || "8787";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyRes", (proxyRes, _req, res) => {
              const ct = proxyRes.headers["content-type"];
              if (ct && String(ct).includes("text/event-stream")) {
                res.setHeader("Cache-Control", "no-cache, no-transform");
                res.setHeader("X-Accel-Buffering", "no");
              }
            });
          },
        },
      },
    },
  };
});
