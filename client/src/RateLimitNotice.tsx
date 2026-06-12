import type { ReactNode } from "react";
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

const inlineLinkClass =
  "font-medium text-playground-ink underline decoration-playground-border underline-offset-2 hover:opacity-80 dark:decoration-white/40";

function OutlineButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="playground-text-body inline-flex h-12 min-w-[120px] max-w-[280px] shrink-0 items-center justify-center rounded-[56px] border-2 border-playground-ink px-5 font-bold leading-5 text-playground-ink transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
    >
      {children}
    </a>
  );
}

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

      <div className="playground-rate-limit-info rounded-[32px] px-8 py-10">
        <p className="playground-text-body mb-4 font-semibold leading-normal text-playground-ink">
          Ohne Wartezeit — drei Wege mit eigenem mittwald API-Key
        </p>
        <ol className="playground-text-body list-decimal space-y-4 pl-5 font-medium leading-normal text-playground-muted marker:font-semibold marker:text-playground-ink">
          <li>
            <a className={inlineLinkClass} href={aiHostingUrl} target="_blank" rel="noreferrer">
              AI Hosting
            </a>{" "}
            im mStudio buchen und API-Key holen — Basis für alles Weitere.
          </li>
          <li>
            <a className={inlineLinkClass} href={LIBRECHAT_URL} target="_blank" rel="noreferrer">
              LibreChat
            </a>{" "}
            oder{" "}
            <a className={inlineLinkClass} href={OPEN_WEBUI_URL} target="_blank" rel="noreferrer">
              Open WebUI
            </a>{" "}
            — am einfachsten im mStudio per{" "}
            <a className={inlineLinkClass} href={CONTAINER_HOSTING_URL} target="_blank" rel="noreferrer">
              Container Hosting
            </a>{" "}
            starten (Open WebUI u. a. in wenigen Minuten, fully managed). Alternativ selbst
            installieren; als OpenAI-API{" "}
            <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[0.9em] text-playground-ink dark:bg-white/[0.12]">
              {MITTWALD_LLM_BASE_URL}
            </code>{" "}
            und deinen mittwald-Key — ChatGPT-ähnlich, deine Limits.
          </li>
          <li>
            Diesen{" "}
            <a className={inlineLinkClass} href={selfHostRepoUrl} target="_blank" rel="noreferrer">
              Playground
            </a>{" "}
            selbst hosten (GitHub) — derselbe Key in der{" "}
            <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[0.9em] text-playground-ink dark:bg-white/[0.12]">
              .env
            </code>
            , Rate-Limits stellst du selbst ein.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <a
          href={aiHostingUrl}
          target="_blank"
          rel="noreferrer"
          className="playground-text-body inline-flex h-12 min-w-[120px] max-w-[280px] items-center justify-center rounded-[48px] bg-playground-send px-5 font-bold leading-5 text-white transition hover:brightness-110"
        >
          AI Hosting &amp; API-Key
        </a>
        <OutlineButton href={CONTAINER_HOSTING_URL}>Container Hosting</OutlineButton>
        <OutlineButton href={LIBRECHAT_URL}>LibreChat</OutlineButton>
        <OutlineButton href={OPEN_WEBUI_URL}>Open WebUI</OutlineButton>
      </div>
    </div>
  );
}
