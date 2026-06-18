/** Öffentliche Playground-Rate-Limits (aus GET /api/config). */
export type PlaygroundRateLimits = {
  windowMs: number;
  windowMinutes: number;
  chat: number;
  models: number;
  transcribe: number;
  webSearch: number;
};

export type PlaygroundBonusChatConfig = {
  enabled: boolean;
  requestsPerGrant: number;
  maxGrantsPerWindow: number;
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
  readonly maxRequests?: number;
  readonly windowMinutes?: number;

  constructor(
    waitMinutes: number,
    scope?: RateLimitScope,
    scopeLabel?: string,
    message?: string,
    maxRequests?: number,
    windowMinutes?: number,
  ) {
    super(message ?? "Rate limit");
    this.name = "RateLimitError";
    this.waitMinutes = waitMinutes;
    this.scope = scope;
    this.scopeLabel = scopeLabel;
    this.maxRequests = maxRequests;
    this.windowMinutes = windowMinutes;
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
  const rawText = (await res.text()).slice(0, 2000);
  if (!rawText.trim()) return {};
  try {
    return JSON.parse(rawText) as ApiErrorJson;
  } catch {
    return { rawText };
  }
}

function isRateLimitErrorInstance(e: unknown): e is RateLimitError {
  return e instanceof RateLimitError || (e instanceof Error && e.name === "RateLimitError");
}

function looksLikeRateLimitMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("rate_limited") ||
    m.includes("too many requests") ||
    m.includes("429") ||
    m.includes("zu viele") ||
    (m.includes("limit") && m.includes("erreicht"))
  );
}

function looksLikePayloadTooLargeMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("payloadtoolarge") ||
    m.includes("payload_too_large") ||
    m.includes("entity too large") ||
    m.includes("request entity too large") ||
    m.includes("anfrage zu groß")
  );
}

export function appErrorFromApiResponse(
  res: Response,
  body: ApiErrorJson,
  rateLimits?: PlaygroundRateLimits | null,
): AppUiError {
  if (res.status === 413 || body.error?.code === "payload_too_large") {
    const msg =
      body.error?.message ??
      "Anfrage zu groß. Bild oder PDF verkleinern oder MAX_BODY_BYTES in der Server-Konfiguration erhöhen.";
    return { kind: "plain", message: msg };
  }
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
    throw new RateLimitError(
      err.waitMinutes,
      err.scope,
      err.scopeLabel,
      body.error?.message,
      err.maxRequests,
      err.windowMinutes,
    );
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
  if (isRateLimitErrorInstance(e)) {
    return {
      kind: "rate_limit",
      waitMinutes: e.waitMinutes,
      scope: e.scope,
      scopeLabel: e.scopeLabel,
      maxRequests: e.maxRequests ?? maxRequestsForScope(e.scope, rateLimits),
      windowMinutes: e.windowMinutes ?? rateLimits?.windowMinutes,
    };
  }
  if (e instanceof Error) {
    if (looksLikeRateLimitMessage(e.message)) {
      return {
        kind: "rate_limit",
        waitMinutes: rateLimits?.windowMinutes ?? 15,
      };
    }
    if (looksLikePayloadTooLargeMessage(e.message)) {
      return {
        kind: "plain",
        message:
          "Anfrage zu groß für den Server. Bild/PDF verkleinern oder MAX_BODY_BYTES in .env erhöhen (z. B. 10485760 für 10 MB).",
      };
    }
    return { kind: "plain", message: extractUserFacingApiError(e.message) };
  }
  return plainAppError("Unbekannter Fehler.");
}

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  return e instanceof Error && e.name === "AbortError";
}

/** Fehler aus Send/Stream — Abort durch Nutzer wird ignoriert (kein UI-Fehler). */
export function appErrorFromSendFailure(
  e: unknown,
  rateLimits?: PlaygroundRateLimits | null,
): AppUiError | null {
  if (isAbortError(e)) return null;
  return appErrorFromUnknown(e, rateLimits);
}

import { apiUrl } from "./appPaths";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

export async function grantBonusChatRequests(): Promise<{
  granted: number;
  remaining: number;
}> {
  const res = await fetch(apiUrl("/api/rate-limit/continue-testing"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    granted?: number;
    remaining?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(
      body.error?.message ?? "Test-Erweiterung konnte nicht aktiviert werden.",
    );
  }
  return {
    granted: body.granted ?? 0,
    remaining: body.remaining ?? 0,
  };
}
