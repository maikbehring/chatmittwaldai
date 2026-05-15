import type { PlaygroundRateLimits, RateLimitScope } from "./apiErrors";

/** OpenAI-kompatible mittwald-API (für LibreChat, Open WebUI, …). */
export const MITTWALD_LLM_BASE_URL = "https://llm.aihosting.mittwald.de/v1";

export const LIBRECHAT_URL = "https://www.librechat.ai/";
export const OPEN_WEBUI_URL = "https://openwebui.com/";
/** LibreChat & Open WebUI u. a. per Container im mStudio — siehe mittwald Container Hosting. */
export const CONTAINER_HOSTING_URL = "https://www.mittwald.de/mstudio/container-hosting";

const SCOPE_UNIT: Record<RateLimitScope, { singular: string; plural: string }> = {
  chat: { singular: "Chat-Nachricht", plural: "Chat-Nachrichten" },
  webSearch: { singular: "Websuche", plural: "Websuchen" },
  transcribe: { singular: "Spracheingabe", plural: "Spracheingaben" },
  models: { singular: "Modell-Abruf", plural: "Modell-Abrufe" },
};

/** Lesbare Quote aus .env-Limits (z. B. „40 Chat-Nachrichten pro 15 Minuten“). */
export function formatRateLimitQuota(
  scope: RateLimitScope | undefined,
  limits: PlaygroundRateLimits | null | undefined,
  maxRequests?: number,
): string | null {
  if (!scope || !limits) return null;
  const max =
    typeof maxRequests === "number" && maxRequests > 0
      ? maxRequests
      : scope === "chat"
        ? limits.chat
        : scope === "webSearch"
          ? limits.webSearch
          : scope === "transcribe"
            ? limits.transcribe
            : scope === "models"
              ? limits.models
              : 0;
  if (!max) return null;
  const unit = max === 1 ? SCOPE_UNIT[scope].singular : SCOPE_UNIT[scope].plural;
  const mins = limits.windowMinutes;
  return `${max} ${unit} pro ${mins} Minute${mins === 1 ? "" : "n"} (pro IP)`;
}
