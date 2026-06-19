import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, "..");
  const env = loadEnv(mode, repoRoot, "");
  const apiPort = env.PORT || "8787";
  const rawBase =
    env.VITE_APP_BASE_PATH?.trim() || (mode === "development" ? "/" : "/ai/");
  const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  const baseNoSlash = base.replace(/\/$/, "");
  const apiProxyPath = `${baseNoSlash}/api`;
  const umamiWebsiteId = env.VITE_UMAMI_WEBSITE_ID?.trim() || "";
  const umamiScriptSrc =
    env.VITE_UMAMI_SCRIPT_SRC?.trim() || "https://cloud.umami.is/script.js";

  return {
    base,
    plugins: [
      react(),
      {
        name: "inject-umami",
        transformIndexHtml(html) {
          if (!umamiWebsiteId) return html;
          if (!/^https:\/\/.+/i.test(umamiScriptSrc) || /["'<>]/.test(umamiScriptSrc)) {
            return html;
          }
          const tag = `    <script defer src="${umamiScriptSrc}" data-website-id="${umamiWebsiteId}"></script>\n`;
          return html.replace("</head>", `${tag}  </head>`);
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        [apiProxyPath]: {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
          rewrite: (requestPath) =>
            baseNoSlash ? requestPath.replace(new RegExp(`^${baseNoSlash}`), "") : requestPath,
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
