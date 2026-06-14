import { useState } from "react";
import type { PlaygroundBonusChatConfig, PlaygroundRateLimits, RateLimitScope } from "./apiErrors";
import { formatRateLimitQuota } from "./rateLimitCopy";

type RateLimitNoticeProps = {
  waitMinutes: number;
  scope?: RateLimitScope;
  scopeLabel?: string;
  maxRequests?: number;
  windowMinutes?: number;
  rateLimits?: PlaygroundRateLimits | null;
  aiHostingUrl: string;
  bonusChat?: PlaygroundBonusChatConfig | null;
  bonusGrantAvailable?: boolean;
  sessionApiKeyActive?: boolean;
  onSaveApiKey?: (key: string) => void;
  onClearApiKey?: () => void;
  onContinueTesting?: () => void;
  continueTestingBusy?: boolean;
};

const inlineLinkClass =
  "font-medium text-playground-ink underline decoration-playground-border underline-offset-2 hover:opacity-80 dark:decoration-white/40";

export function RateLimitNotice({
  waitMinutes,
  scope,
  scopeLabel,
  maxRequests,
  windowMinutes,
  rateLimits,
  aiHostingUrl,
  bonusChat,
  bonusGrantAvailable = true,
  sessionApiKeyActive = false,
  onSaveApiKey,
  onClearApiKey,
  onContinueTesting,
  continueTestingBusy = false,
}: RateLimitNoticeProps) {
  const [apiKeyDraft, setApiKeyDraft] = useState("");

  const quota =
    formatRateLimitQuota(scope, rateLimits, maxRequests) ??
    (typeof maxRequests === "number" &&
    maxRequests > 0 &&
    typeof windowMinutes === "number" &&
    windowMinutes > 0
      ? `${maxRequests} Anfragen pro ${windowMinutes} Minute${windowMinutes === 1 ? "" : "n"} (pro IP)`
      : null);

  const showContinueTesting =
    !sessionApiKeyActive &&
    bonusChat?.enabled &&
    bonusGrantAvailable &&
    onContinueTesting &&
    (scope === "chat" || scope === undefined);
  const grantSize = bonusChat?.requestsPerGrant ?? 5;

  const handleSave = () => {
    const key = apiKeyDraft.trim();
    if (!key || !onSaveApiKey) return;
    onSaveApiKey(key);
    setApiKeyDraft("");
  };

  return (
    <div
      className="flex w-full flex-col gap-5 rounded-[32px] bg-playground-sidebar px-8 py-8 text-playground-ink sm:px-12"
      role="alert"
    >
      <h2
        id="rate-limit-title"
        className="playground-text-limit-title font-display font-semibold tracking-[-0.01em] text-playground-ink"
      >
        Kurz Pause — Limit erreicht
      </h2>

      <p className="playground-text-body font-medium leading-normal text-playground-muted">
        Dieser öffentliche Playground schützt sich vor Überlastung
        {quota ? (
          <>
            {" "}
            — aktuell gilt: <span className="font-semibold text-playground-ink">{quota}</span>
          </>
        ) : scopeLabel ? (
          <>
            {" "}
            — Limit für <span className="font-semibold text-playground-ink">{scopeLabel}</span>
          </>
        ) : null}
        . In etwa{" "}
        <span className="font-semibold text-playground-ink">
          {waitMinutes} Minute{waitMinutes === 1 ? "" : "n"}
        </span>{" "}
        kannst du hier normal weitermachen.
      </p>

      <div className="playground-rate-limit-info rounded-[32px] px-6 py-8 sm:px-8">
        <p className="playground-text-body mb-3 font-semibold leading-normal text-playground-ink">
          Ohne Wartezeit mit eigenem API-Key
        </p>
        <p className="playground-text-body mb-5 font-medium leading-normal text-playground-muted">
          <a className={inlineLinkClass} href={aiHostingUrl} target="_blank" rel="noreferrer">
            AI Hosting im mStudio buchen
          </a>
          , API-Key kopieren und hier eintragen — dann nutzt du dein Kontingent statt des
          öffentlichen Limits. Der Key bleibt nur in dieser Browser-Session gespeichert.
        </p>
        <p className="playground-text-small mb-5 font-medium leading-snug text-playground-muted">
          Sicherheit: Nur zum kurzen Weiterarbeiten — nicht auf gemeinsamen Geräten. Tab schließen
          oder Key entfernen, wenn du fertig bist. Für Produktion eigenes Hosting nutzen.
        </p>

        {sessionApiKeyActive ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="playground-text-body font-medium text-playground-ink">
              ✓ API-Key hinterlegt (nur diese Session)
            </p>
            {onClearApiKey ? (
              <button
                type="button"
                onClick={onClearApiKey}
                className="playground-text-small font-semibold text-playground-muted underline underline-offset-2 hover:text-playground-ink"
              >
                Key entfernen
              </button>
            ) : null}
          </div>
        ) : onSaveApiKey ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="playground-text-small mb-1.5 block font-semibold text-playground-ink">
                mittwald API-Key
              </span>
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
                spellCheck={false}
                className="playground-text-body w-full rounded-xl border border-playground-border bg-playground-main px-3 py-2.5 text-playground-ink outline-none focus-visible:ring-2 focus-visible:ring-playground-border"
              />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={apiKeyDraft.trim().length < 8}
              className="playground-text-body inline-flex h-12 shrink-0 items-center justify-center rounded-[48px] bg-playground-send px-6 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Speichern &amp; weiter
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <a
          href={aiHostingUrl}
          target="_blank"
          rel="noreferrer"
          className="playground-text-body inline-flex h-12 min-w-[120px] items-center justify-center rounded-[48px] bg-playground-send px-5 font-bold leading-5 text-white transition hover:brightness-110"
        >
          AI Hosting buchen
        </a>
        {showContinueTesting ? (
          <button
            type="button"
            onClick={onContinueTesting}
            disabled={continueTestingBusy}
            className="playground-text-body inline-flex h-12 min-w-[120px] items-center justify-center rounded-[56px] border-2 border-playground-ink px-5 font-bold leading-5 text-playground-ink transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.06]"
          >
            {continueTestingBusy ? "Wird freigeschaltet …" : `Weiter testen (+${grantSize})`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
