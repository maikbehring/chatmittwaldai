/**
 * Öffentlicher Unterpfad (z. B. /ai unter playground.mittwald.de/ai).
 * Reverse-Proxy leitet oft den vollen Pfad weiter — Express routet intern ab /.
 */

/** @param {string | undefined} raw */
export function normalizePlaygroundBasePath(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "/") return "";
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return withSlash.replace(/\/$/, "");
}

/**
 * @param {string} base z. B. "/ai"
 * @returns {import("express").RequestHandler}
 */
export function createBasePathStripMiddleware(base) {
  const prefix = normalizePlaygroundBasePath(base);
  if (!prefix) {
    return (_req, _res, next) => next();
  }

  return (req, _res, next) => {
    const pathOnly = req.path;
    if (pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)) {
      const rest = pathOnly.slice(prefix.length) || "/";
      const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      req.url = `${rest}${query}`;
    }
    next();
  };
}
