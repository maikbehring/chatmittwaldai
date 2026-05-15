/** Öffentliche Playground-Rate-Limits (aus GET /api/config). */
export type PlaygroundRateLimits = {
  windowMs: number;
  windowMinutes: number;
  chat: number;
  models: number;
  transcribe: number;
  webSearch: number;
};

export type RateLimitScope = "chat" | "models" | "transcribe" | "webSearch";

export type AppUiError =
  | { kind: "plain"; message: string }
  | {
      kind: "rate_limit";
      waitMinutes: number;
      scope?: RateLimitScope;
      scopeLabel?: string;
      maxRequests?: number;
      windowMinutes?: number;
    };

export class RateLimitError extends Error {
  readonly waitMinutes: number;
  readonly scope?: RateLimitScope;
  readonly scopeLabel?: string;

  constructor(waitMinutes: number, scope?: RateLimitScope, scopeLabel?: string, message?: string) {
    super(message ?? "Rate limit");
    this.name = "RateLimitError";
    this.waitMinutes = waitMinutes;
    this.scope = scope;
    this.scopeLabel = scopeLabel;
  }
}

type ApiErrorJson = {
  error?: {
    code?: string;
    message?: string;
    scope?: RateLimitScope;
    scopeLabel?: string;
    retryAfterMinutes?: number;
    retryAfterSeconds?: number;
    maxRequests?: number;
    windowMinutes?: number;
  };
  rawText?: string;
};

export function maxRequestsForScope(
  scope: RateLimitScope | undefined,
  limits: PlaygroundRateLimits | null | undefined,
): number | undefined {
  if (!scope || !limits) return undefined;
  if (scope === "chat") return limits.chat;
  if (scope === "models") return limits.models;
  if (scope === "transcribe") return limits.transcribe;
  if (scope === "webSearch") return limits.webSearch;
  return undefined;
}

function waitMinutesFromResponse(
  res: Response,
  body: ApiErrorJson,
  fallback?: PlaygroundRateLimits | null,
): number {
  const fromBody = body.error?.retryAfterMinutes;
  if (typeof fromBody === "number" && fromBody > 0) return fromBody;
  const retryHeader = res.headers.get("Retry-After");
  if (retryHeader) {
    const sec = Number(retryHeader);
    if (Number.isFinite(sec) && sec > 0) return Math.max(1, Math.ceil(sec / 60));
  }
  const secBody = body.error?.retryAfterSeconds;
  if (typeof secBody === "number" && secBody > 0) return Math.max(1, Math.ceil(secBody / 60));
  return fallback?.windowMinutes ?? 15;
}

export async function readApiErrorBody(res: Response): Promise<ApiErrorJson & { rawText?: string }> {
  try {
    return (await res.json()) as ApiErrorJson;
  } catch {
    const rawText = (await res.text()).slice(0, 2000);
    return { rawText };
  }
}

export function appErrorFromApiResponse(
  res: Response,
  body: ApiErrorJson,
  rateLimits?: PlaygroundRateLimits | null,
): AppUiError {
  if (res.status === 429 || body.error?.code === "rate_limited") {
    const scope = body.error?.scope;
    const maxRequests =
      typeof body.error?.maxRequests === "number"
        ? body.error.maxRequests
        : maxRequestsForScope(scope, rateLimits);
    const windowMinutes =
      typeof body.error?.windowMinutes === "number" && body.error.windowMinutes > 0
        ? body.error.windowMinutes
        : rateLimits?.windowMinutes;
    return {
      kind: "rate_limit",
      waitMinutes: waitMinutesFromResponse(res, body, rateLimits),
      scope,
      scopeLabel: body.error?.scopeLabel,
      maxRequests,
      windowMinutes,
    };
  }
  const msg =
    body.error?.message ??
    (typeof body.rawText === "string" && body.rawText.trim() ? body.rawText.slice(0, 500) : null) ??
    res.statusText ??
    "Anfrage fehlgeschlagen.";
  return { kind: "plain", message: msg };
}

export async function ensureOkApiResponse(
  res: Response,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<void> {
  if (res.ok) return;
  const body = await readApiErrorBody(res);
  const err = appErrorFromApiResponse(res, body, rateLimits);
  if (err.kind === "rate_limit") {
    throw new RateLimitError(err.waitMinutes, err.scope, err.scopeLabel, body.error?.message);
  }
  throw new Error(err.message);
}

/** Liest ggf. verschachtelte JSON-Fehler (z. B. LLM-API) aus einer Rohtext-Meldung. */
export function extractUserFacingApiError(message: string): string {
  const m = message.trim();
  if (!m.startsWith("{")) return message;
  try {
    const o = JSON.parse(m) as {
      error?: { message?: string; type?: string; code?: string };
      message?: string;
    };
    const inner =
      (typeof o.error?.message === "string" && o.error.message) ||
      (typeof o.message === "string" && o.message) ||
      "";
    if (!inner) return message;
    const type = o.error?.type && o.error.type !== "None" ? ` [${o.error.type}]` : "";
    const code = o.error?.code && o.error.code !== "None" ? ` (${String(o.error.code)})` : "";
    return `${inner}${type}${code}`;
  } catch {
    return message;
  }
}

export function plainAppError(message: string): AppUiError {
  return { kind: "plain", message: extractUserFacingApiError(message) };
}

export function appErrorFromUnknown(
  e: unknown,
  rateLimits?: PlaygroundRateLimits | null,
): AppUiError {
  if (e instanceof RateLimitError) {
    return {
      kind: "rate_limit",
      waitMinutes: e.waitMinutes,
      scope: e.scope,
      scopeLabel: e.scopeLabel,
      maxRequests: maxRequestsForScope(e.scope, rateLimits),
      windowMinutes: rateLimits?.windowMinutes,
    };
  }
  if (e instanceof Error) {
    if (e.message.toLowerCase().includes("rate") || e.message.includes("Zu viele")) {
      return {
        kind: "rate_limit",
        waitMinutes: rateLimits?.windowMinutes ?? 15,
      };
    }
    return { kind: "plain", message: extractUserFacingApiError(e.message) };
  }
  return plainAppError("Unbekannter Fehler.");
}
