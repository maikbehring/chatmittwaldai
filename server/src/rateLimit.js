/**
 * Rate-Limit-Konfiguration und einheitliche 429-Antworten für den Playground-Proxy.
 */

const SCOPE_LABELS = {
  chat: "Chat-Nachrichten",
  models: "Modellliste",
  transcribe: "Spracheingaben",
  webSearch: "Websuchen",
};

export function getRateLimitConfig() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 900000);
  const windowMinutes = Math.max(1, Math.round(windowMs / 60_000));
  return {
    windowMs,
    windowMinutes,
    chat: Number(process.env.RATE_LIMIT_MAX_CHAT || 40),
    models: Number(process.env.RATE_LIMIT_MAX_MODELS || 120),
    transcribe: Number(process.env.RATE_LIMIT_MAX_TRANSCRIBE || 30),
    webSearch: Number(process.env.RATE_LIMIT_MAX_WEB_SEARCH || 30),
  };
}

function maxRequestsForScope(scope, limits) {
  if (scope === "chat") return limits.chat;
  if (scope === "models") return limits.models;
  if (scope === "transcribe") return limits.transcribe;
  if (scope === "webSearch") return limits.webSearch;
  return null;
}

export function buildRateLimitPayload(scope, windowMs) {
  const limits = getRateLimitConfig();
  const ms = windowMs ?? limits.windowMs;
  const windowMinutes = Math.max(1, Math.round(ms / 60_000));
  const retryAfterSeconds = Math.max(1, Math.ceil(ms / 1000));
  const retryAfterMinutes = windowMinutes;
  const scopeLabel = SCOPE_LABELS[scope] ?? "Anfragen";
  const maxRequests = maxRequestsForScope(scope, limits);
  const quotaHint =
    typeof maxRequests === "number" && maxRequests > 0
      ? ` (Limit: ${maxRequests} pro ${windowMinutes} Min., konfiguriert in .env)`
      : "";
  return {
    error: {
      code: "rate_limited",
      scope,
      scopeLabel,
      maxRequests: maxRequests ?? undefined,
      windowMinutes,
      message: `Limit für ${scopeLabel} erreicht${quotaHint}. Bitte in etwa ${retryAfterMinutes} Minute${retryAfterMinutes === 1 ? "" : "n"} erneut versuchen — oder LibreChat/Open WebUI per mittwald Container Hosting mit API-Key nutzen.`,
      retryAfterSeconds,
      retryAfterMinutes,
    },
  };
}

/** @param {"chat"|"models"|"transcribe"|"webSearch"} scope */
export function createRateLimitHandler(scope) {
  return (_req, res, _next, options) => {
    const windowMs = options.windowMs;
    const payload = buildRateLimitPayload(scope, windowMs);
    const retryAfterSeconds = payload.error.retryAfterSeconds;
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(options.statusCode).json(payload);
  };
}
