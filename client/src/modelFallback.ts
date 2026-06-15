import { isAbortError } from "./apiErrors";
import {
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
} from "./modelPresets";

const DEFAULT_FALLBACK_CHAINS: Record<string, string[]> = {
  [MODEL_QWEN_36]: [MODEL_QWEN_35, MODEL_MINISTRAL, MODEL_GPT_OSS],
  [MODEL_QWEN_35]: [MODEL_QWEN_36, MODEL_MINISTRAL],
};

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "");
}

function looksLikeRateLimitMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("rate_limited") ||
    m.includes("too many requests") ||
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
    m.includes("anfrage zu groß")
  );
}

/** Fehler, bei denen ein anderes Modell sinnvoll versucht werden kann. */
export function isModelUnreachableError(e: unknown): boolean {
  if (isAbortError(e)) return false;
  const msg = errorMessage(e).toLowerCase();
  if (!msg) return false;
  if (looksLikeRateLimitMessage(msg) || looksLikePayloadTooLargeMessage(msg)) return false;
  if (msg.includes("validation_error") || msg.includes("ungültig")) return false;

  return (
    msg.includes("keine antwort vom modell") ||
    msg.includes("innerhalb von") ||
    msg.includes("upstream_unreachable") ||
    msg.includes("upstream_error") ||
    msg.includes("stream_failed") ||
    msg.includes("models_fetch_failed") ||
    msg.includes("verbindung zum llm") ||
    msg.includes("service unavailable") ||
    msg.includes("bad gateway") ||
    msg.includes("gateway timeout") ||
    msg.includes("nicht erreichbar") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("no healthy upstream") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("connection closed") ||
    msg.includes("verbindung") ||
    /\b502\b/.test(msg) ||
    /\b503\b/.test(msg) ||
    /\b504\b/.test(msg) ||
    (msg.includes("model") &&
      (msg.includes("not found") ||
        msg.includes("does not exist") ||
        msg.includes("unavailable") ||
        msg.includes("nicht verfügbar") ||
        msg.includes("nicht gefunden")))
  );
}

/**
 * Nächstes Fallback-Modell aus Use-Case-Vorgabe oder Standard-Kette,
 * sofern in der erlaubten Modellliste.
 */
export function resolveModelFallback(
  primaryModelId: string,
  allowedModelIds: string[],
  explicitFallback?: string,
): string | null {
  const allowed = new Set(allowedModelIds);
  if (
    explicitFallback &&
    explicitFallback !== primaryModelId &&
    allowed.has(explicitFallback)
  ) {
    return explicitFallback;
  }
  const chain = DEFAULT_FALLBACK_CHAINS[primaryModelId] ?? [];
  return chain.find((id) => id !== primaryModelId && allowed.has(id)) ?? null;
}
