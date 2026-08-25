import { MITTWALD_AI_DEDICATED_HOSTING_URL } from "./playgroundSalesLinks";
import {
  trackUmamiEvent,
  UMAMI_EVENT_AI_HOSTING_BOOK,
  UMAMI_EVENT_CONSULT_CALL,
  UMAMI_EVENT_DEDICATED_HOSTING,
} from "./umami";

export const TARIF_CONSULT_PHONE = "+49 5772 293 150";
export const TARIF_CONSULT_PHONE_HREF = "tel:+495772293150";

type Props = {
  aiHostingUrl: string;
  className?: string;
};

function DedicatedLink() {
  return (
    <a
      href={MITTWALD_AI_DEDICATED_HOSTING_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackUmamiEvent(UMAMI_EVENT_DEDICATED_HOSTING, { platzierung: "banner" })}
      className="playground-text-tiny text-center font-semibold text-playground-link underline decoration-playground-link/25 underline-offset-2 transition hover:text-playground-link-hover"
    >
      Neu: Dedicated AI Hosting
    </a>
  );
}

function BookCta({ href, className = "" }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackUmamiEvent(UMAMI_EVENT_AI_HOSTING_BOOK, { platzierung: "banner" })}
      className={`playground-cta-gradient playground-text-small flex h-10 w-full items-center justify-center rounded-full px-4 font-bold !leading-5 text-white transition hover:brightness-110 ${className}`.trim()}
    >
      AI Hosting buchen
    </a>
  );
}

function CallCta({ className = "" }: { className?: string }) {
  return (
    <a
      href={TARIF_CONSULT_PHONE_HREF}
      onClick={() => trackUmamiEvent(UMAMI_EVENT_CONSULT_CALL, { platzierung: "banner" })}
      className={`flex w-full flex-col items-center justify-center rounded-full border border-playground-border bg-playground-main/60 px-3 py-2 transition hover:border-playground-muted/25 hover:bg-playground-muted/[0.06] ${className}`.trim()}
    >
      <span className="playground-text-tiny font-bold text-playground-ink">Beratung anrufen</span>
      <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium tabular-nums text-playground-muted">
        {TARIF_CONSULT_PHONE}
      </span>
    </a>
  );
}

/** Banner unter den Use Cases auf der Startseite. */
export function PlaygroundHostingUpsell({ aiHostingUrl, className = "" }: Props) {
  return (
    <div
      className={`w-full max-w-[960px] rounded-2xl border border-playground-border bg-playground-sidebar px-4 py-4 sm:rounded-3xl sm:px-6 sm:py-5 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:max-w-md sm:text-left">
          <p className="playground-text-body font-bold text-playground-ink">
            Demo gesehen — bereit für Produktion?
          </p>
          <p className="playground-text-tiny mt-1 text-playground-muted">
            AI Hosting buchen oder kurz mit uns sprechen — Tarifberatung in unter einer Minute.
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:min-w-[220px]">
          <BookCta href={aiHostingUrl} />
          <CallCta />
          <DedicatedLink />
        </div>
      </div>
    </div>
  );
}
