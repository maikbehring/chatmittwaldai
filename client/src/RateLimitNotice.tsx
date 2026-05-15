import type { PlaygroundRateLimits, RateLimitScope } from "./apiErrors";
import {
  CONTAINER_HOSTING_URL,
  formatRateLimitQuota,
  LIBRECHAT_URL,
  MITTWALD_LLM_BASE_URL,
  OPEN_WEBUI_URL,
} from "./rateLimitCopy";
import { GITHUB_REPO_URL } from "./repoLinks";

type RateLimitNoticeProps = {
  waitMinutes: number;
  scope?: RateLimitScope;
  scopeLabel?: string;
  maxRequests?: number;
  windowMinutes?: number;
  rateLimits?: PlaygroundRateLimits | null;
  aiHostingUrl: string;
  selfHostRepoUrl?: string;
};

const linkClass =
  "font-medium text-amber-950 underline decoration-amber-400/90 underline-offset-2 hover:text-amber-900 dark:text-amber-100 dark:decoration-amber-600 dark:hover:text-white";

export function RateLimitNotice({
  waitMinutes,
  scope,
  scopeLabel,
  maxRequests,
  windowMinutes,
  rateLimits,
  aiHostingUrl,
  selfHostRepoUrl = GITHUB_REPO_URL,
}: RateLimitNoticeProps) {
  const quota =
    formatRateLimitQuota(scope, rateLimits, maxRequests) ??
    (typeof maxRequests === "number" &&
    maxRequests > 0 &&
    typeof windowMinutes === "number" &&
    windowMinutes > 0
      ? `${maxRequests} Anfragen pro ${windowMinutes} Minute${windowMinutes === 1 ? "" : "n"} (pro IP)`
      : null);

  return (
    <div
      className="overflow-hidden rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/80 px-4 py-3.5 text-sm shadow-sm dark:border-amber-800/50 dark:from-amber-950/50 dark:via-neutral-950 dark:to-amber-950/20"
      role="alert"
    >
      <p className="text-[15px] font-semibold tracking-tight text-amber-950 dark:text-amber-50">
        Kurz Pause — Limit erreicht
      </p>
      <p className="mt-1.5 leading-relaxed text-amber-900/95 dark:text-amber-100/90">
        Dieser öffentliche Playground schützt sich vor Überlastung
        {quota ? (
          <>
            {" "}
            — aktuell gilt:{" "}
            <span className="font-medium text-amber-950 dark:text-amber-50">{quota}</span>
          </>
        ) : scopeLabel ? (
          <>
            {" "}
            — Limit für <span className="font-medium">{scopeLabel}</span>
          </>
        ) : null}
        . In etwa{" "}
        <strong className="font-semibold text-amber-950 dark:text-amber-50">
          {waitMinutes} Minute{waitMinutes === 1 ? "" : "n"}
        </strong>{" "}
        kannst du hier normal weitermachen.
      </p>

      <div className="mt-3 rounded-lg border border-amber-200/70 bg-white/70 px-3 py-2.5 dark:border-amber-800/40 dark:bg-neutral-900/35">
        <p className="text-[13px] font-medium text-amber-950 dark:text-amber-50">
          Ohne Wartezeit — drei Wege mit eigenem mittwald API-Key
        </p>
        <ul className="mt-2 space-y-2.5 text-[13px] leading-relaxed text-amber-900/95 dark:text-amber-100/85">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-semibold text-amber-700 dark:text-amber-400">1.</span>
            <span>
              <a className={linkClass} href={aiHostingUrl} target="_blank" rel="noreferrer">
                AI Hosting
              </a>{" "}
              im mStudio buchen und API-Key holen — Basis für alles Weitere.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-semibold text-amber-700 dark:text-amber-400">2.</span>
            <span>
              <a className={linkClass} href={LIBRECHAT_URL} target="_blank" rel="noreferrer">
                LibreChat
              </a>{" "}
              oder{" "}
              <a className={linkClass} href={OPEN_WEBUI_URL} target="_blank" rel="noreferrer">
                Open WebUI
              </a>{" "}
              — am einfachsten im mStudio per{" "}
              <a className={linkClass} href={CONTAINER_HOSTING_URL} target="_blank" rel="noreferrer">
                Container Hosting
              </a>{" "}
              starten (Open WebUI u. a. in wenigen Minuten, fully managed). Alternativ selbst
              installieren; als OpenAI-API{" "}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-[11px] text-amber-950 dark:bg-amber-950/60 dark:text-amber-100">
                {MITTWALD_LLM_BASE_URL}
              </code>{" "}
              und deinen mittwald-Key — ChatGPT-ähnlich, deine Limits.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-semibold text-amber-700 dark:text-amber-400">3.</span>
            <span>
              Diesen{" "}
              <a className={linkClass} href={selfHostRepoUrl} target="_blank" rel="noreferrer">
                Playground
              </a>{" "}
              selbst hosten (GitHub) — derselbe Key in der <code className="text-[11px]">.env</code>
              , Rate-Limits stellst du selbst ein.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={aiHostingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-[#1a6fb5] px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#155a94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a6fb5] dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:outline-sky-500"
        >
          AI Hosting &amp; API-Key →
        </a>
        <a
          href={CONTAINER_HOSTING_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-amber-300/80 bg-white/90 px-3 py-1.5 text-[13px] font-medium text-amber-950 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-neutral-900/50 dark:text-amber-50 dark:hover:bg-amber-950/40"
        >
          Container Hosting
        </a>
        <a
          href={LIBRECHAT_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-amber-300/80 bg-white/90 px-3 py-1.5 text-[13px] font-medium text-amber-950 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-neutral-900/50 dark:text-amber-50 dark:hover:bg-amber-950/40"
        >
          LibreChat
        </a>
        <a
          href={OPEN_WEBUI_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-amber-300/80 bg-white/90 px-3 py-1.5 text-[13px] font-medium text-amber-950 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-neutral-900/50 dark:text-amber-50 dark:hover:bg-amber-950/40"
        >
          Open WebUI
        </a>
        <a
          href={selfHostRepoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] font-medium text-amber-900 underline decoration-amber-400/80 underline-offset-2 hover:text-amber-950 dark:text-amber-200 dark:decoration-amber-600 dark:hover:text-amber-50"
        >
          Playground (GitHub)
        </a>
      </div>
    </div>
  );
}
