/**
 * Öffentlicher App-Pfad (Vite `base`), z. B. `/ai/` unter playground.mittwald.de/ai.
 * API und Assets müssen diesen Prefix nutzen — der Reverse-Proxy leitet /ai/* an den Container weiter.
 */
const viteBase = import.meta.env.BASE_URL;

/** Basis mit trailing slash, z. B. `/ai/` oder `/`. */
export function appBasePath(): string {
  return viteBase.endsWith("/") ? viteBase : `${viteBase}/`;
}

/** Pfad zu statischen Assets unter public/ (Brand, Favicon, …). */
export function assetUrl(relativePath: string): string {
  const rel = relativePath.replace(/^\//, "");
  return `${appBasePath()}${rel}`;
}

/** Playground-API (Express-Routen unter /api/* am Container-Root). */
export function apiUrl(apiPath: string): string {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const base = appBasePath().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
