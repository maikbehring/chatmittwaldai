import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

/** Wartezeit auf das erste Stream-Token, danach Fallback (falls konfiguriert). */
export const MODEL_FIRST_TOKEN_TIMEOUT_MS = 15_000;

type StreamTokenMeter = {
  promptTokens: number | null;
  completionTokens: number | null;
  outputTokensPerSec: number | null;
};

/** Sichtbare Antwort-Token (ohne reasoning_content — der würde die UI blockieren). */
function extractStreamDeltaContent(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const root = json as Record<string, unknown>;
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const ch0 = choices[0];
  if (!ch0 || typeof ch0 !== "object") return "";
  const choice = ch0 as Record<string, unknown>;
  const delta = choice.delta;
  if (delta && typeof delta === "object") {
    const d = delta as Record<string, unknown>;
    const content = d.content;
    if (typeof content === "string" && content.length > 0) return content;
  }
  const text = choice.text;
  if (typeof text === "string" && text.length > 0) return text;
  return "";
}

function linkAbortSignal(parent: AbortSignal): {
  signal: AbortSignal;
  abort: () => void;
} {
  const ctrl = new AbortController();
  const onParentAbort = () => ctrl.abort();
  if (parent.aborted) ctrl.abort();
  else parent.addEventListener("abort", onParentAbort, { once: true });
  return {
    signal: ctrl.signal,
    abort: () => {
      parent.removeEventListener("abort", onParentAbort);
      ctrl.abort();
    },
  };
}

export async function streamChatCompletion(
  body: Record<string, unknown>,
  onDelta: (t: string) => void,
  signal: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<StreamTokenMeter | null> {
  const res = await fetch(apiUrl("/api/chat/completions"), {
    method: "POST",
    headers: playgroundApiHeaders({
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    }),
    body: JSON.stringify(body),
    signal,
  });

  await ensureOkApiResponse(res, rateLimits);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Keine Antwort vom Server.");

  const decoder = new TextDecoder();
  let buffer = "";
  let lastUsage: StreamTokenMeter | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let lineBreak: number;
    while ((lineBreak = buffer.indexOf("\n")) !== -1) {
      const rawLine = buffer.slice(0, lineBreak);
      buffer = buffer.slice(lineBreak + 1);
      const line = rawLine.replace(/\r$/, "").trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return lastUsage;
      try {
        const streamPayload = JSON.parse(payload) as Record<string, unknown>;
        const rawUsageField = streamPayload.usage;
        if (rawUsageField && typeof rawUsageField === "object") {
          const uo = rawUsageField as Record<string, unknown>;
          const pTok = uo.prompt_tokens;
          const cTok = uo.completion_tokens;
          const promptTokens = typeof pTok === "number" ? pTok : null;
          const completionTokens = typeof cTok === "number" ? cTok : null;
          if (promptTokens !== null || completionTokens !== null) {
            const prevUsage = lastUsage as StreamTokenMeter | null;
            lastUsage = {
              promptTokens: promptTokens ?? prevUsage?.promptTokens ?? null,
              completionTokens: completionTokens ?? prevUsage?.completionTokens ?? null,
              outputTokensPerSec: null,
            };
          }
        }
        const piece = extractStreamDeltaContent(streamPayload);
        if (piece.length > 0) onDelta(piece);
      } catch {
        /* SSE-Zeile ignorieren */
      }
    }
  }
  return lastUsage;
}

export class ModelFirstTokenTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    const secs = Math.round(timeoutMs / 1000);
    super(
      `upstream_unreachable: Keine Antwort vom Modell innerhalb von ${secs} Sekunden.`,
    );
    this.name = "ModelFirstTokenTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/** Bricht ab, wenn vor dem ersten Inhalts-Token die Wartezeit überschritten wird. */
export async function streamChatCompletionWithFirstTokenTimeout(
  body: Record<string, unknown>,
  onDelta: (t: string) => void,
  parentSignal: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
  timeoutMs: number = MODEL_FIRST_TOKEN_TIMEOUT_MS,
): Promise<StreamTokenMeter | null> {
  const linked = linkAbortSignal(parentSignal);
  let receivedFirstToken = false;
  let timedOut = false;

  const timeoutId = window.setTimeout(() => {
    if (!receivedFirstToken) {
      timedOut = true;
      linked.abort();
    }
  }, timeoutMs);

  try {
    return await streamChatCompletion(
      body,
      (delta) => {
        if (delta.length > 0) {
          receivedFirstToken = true;
          clearTimeout(timeoutId);
        }
        onDelta(delta);
      },
      linked.signal,
      rateLimits,
    );
  } catch (e) {
    if (timedOut && !parentSignal.aborted) {
      throw new ModelFirstTokenTimeoutError(timeoutMs);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
