import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { formatPlaygroundAiHostingDedicatedSalesContext } from "./playgroundAiHostingDedicatedSales";
import { formatPlaygroundAiHostingContainerTemplatesContext } from "./playgroundAiHostingContainerTemplates";
import { formatPlaygroundAiHostingTariffFaqContext } from "./playgroundAiHostingTariffFaq";
import { formatPlaygroundMittwaldContext } from "./playgroundMittwaldContext";
import {
  MITTWALD_AI_HOSTING_TARIFF_URL,
  MITTWALD_MSTUDIO_URL,
  MITTWALD_SALES_URL,
  MITTWALD_TARIF_CONSULT_PHONE,
} from "./playgroundSalesLinks";
import { formatPlaygroundTodayContext } from "./playgroundDate";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import type { AiHostingModelRow } from "./mittwaldAiHostingDocs";

export type AiHostingTariffPlan = {
  name: string;
  priceMonthly: string | null;
  tagline: string;
  features: string[];
};

export type MittwaldAiHostingTariffAdvisorResponse = {
  fetchedAt: string;
  sources: string[];
  apiBaseUrl: string;
  warnings?: string[];
  tariffs: {
    fetchedAt: string;
    url: string;
    plans: AiHostingTariffPlan[];
    contractNotes: string[];
    live?: boolean;
    parseWarning?: string | null;
  };
  modelsPage: {
    url: string;
    title: string;
    intro: string[];
    models: AiHostingModelRow[];
    recommendations: string[];
    tip: string;
  };
};

function formatIssueDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function fetchMittwaldAiHostingTariffAdvisor(
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<MittwaldAiHostingTariffAdvisorResponse> {
  const res = await fetch(apiUrl("/api/mittwald/ai-hosting-tariff-advisor"), {
    headers: playgroundApiHeaders(),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as MittwaldAiHostingTariffAdvisorResponse;
}

export function formatMittwaldAiHostingTariffAdvisorContext(
  data: MittwaldAiHostingTariffAdvisorResponse,
): string {
  const planLines = data.tariffs.plans.map(
    (p, i) =>
      `[T${i + 1}] ${p.name}${p.priceMonthly ? ` — ${p.priceMonthly}/Monat zzgl. USt.` : ""}` +
      (p.tagline ? `\nKurz: ${p.tagline}` : "") +
      (p.features.length ? `\nEnthalten: ${p.features.join(" · ")}` : ""),
  );

  const modelLines = data.modelsPage.models.map(
    (m, i) =>
      `[M${i + 1}] ${m.name}\nTyp: ${m.type} · ${m.modalities}\nContext: ${m.contextTokens} · Lizenz: ${m.license}` +
      (typeof m.inPlayground === "boolean"
        ? `\nPlayground: ${m.inPlayground ? "ja" : "nein"}`
        : ""),
  );

  const recLines = data.modelsPage.recommendations.map((r, i) => `[R${i + 1}] ${r}`);

  const liveTariffsAvailable = data.tariffs.plans.length > 0;
  const liveTariffsSection = liveTariffsAvailable
    ? `## Aktuelle Tarife (live, Shared)\n` +
      planLines.join("\n\n") +
      (data.tariffs.contractNotes.length
        ? `\n\nVertragsdetails Shared-Tarife (Seite): ${data.tariffs.contractNotes.join(" · ")}`
        : "")
    : `## Aktuelle Tarife (live, Shared)\n` +
      `**Hinweis:** Live-Tarifdaten derzeit nicht verfügbar` +
      (data.tariffs.parseWarning ? ` (${data.tariffs.parseWarning})` : "") +
      `. Orientierung über **kuratiertes FAQ**, **Dedicated-Vertriebsblock** und Tarifseite ${MITTWALD_AI_HOSTING_TARIFF_URL} — **keine erfundenen Shared-Preise**.`;

  const liveTariffRule = liveTariffsAvailable
    ? `Shared-Tarifpreise (Starter/Pro/Business) nur aus den Live-Tarifdaten unten. `
    : `Live-Tarifdaten fehlen — Shared-Preise/Kontingente nur aus **FAQ** (wo hinterlegt) oder Tarifseite/Vertrieb nennen, **nicht erfinden**. `;

  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground — AI Hosting Tarifberatung (live, Stand: ${formatIssueDate(data.fetchedAt)})]\n` +
    `BETA: Orientierung im Playground — keine verbindliche Angebotsberatung. Kaufentscheidung: Vertrieb ${MITTWALD_TARIF_CONSULT_PHONE} · ${MITTWALD_SALES_URL}\n` +
    `Quellen:\n- ${data.tariffs.url}${liveTariffsAvailable ? " (live)" : " (Parse fehlgeschlagen — FAQ/Dedicated nutzen)"}\n- ${data.modelsPage.url}\n` +
    `API-Base-URL: ${data.apiBaseUrl}\n\n` +
    `WICHTIG: ${liveTariffRule}` +
    `Dedicated AI Hosting (M/L/XL, RTX 6000 PRO) nur aus dem Vertriebs-Block weiter unten — nicht erfinden. ` +
    `Modell-Empfehlungen aus Live-Doku + kuratiertem FAQ. Keine erfundenen Preise.\n` +
    `Kommunikationsstil: mittwald-Kundenservice-Chat — nur die gestellte Frage beantworten, Kontext intern nutzen, nicht ausgeben.\n` +
    `Bei produktivem Go-Live oder hohem/unsicherem Volumen: gemeinsamen Lasttest vor Livegang anbieten (Vertrieb ${MITTWALD_TARIF_CONSULT_PHONE}).\n` +
    `Bei Tarifbuchung (Shared): Tarifseite ${MITTWALD_AI_HOSTING_TARIFF_URL} · mStudio ${MITTWALD_MSTUDIO_URL} · API-Keys im mStudio (nur Shared). Dedicated: Vertrieb · Keys/Einrichtung durch mittwald · Vertrieb: ${MITTWALD_TARIF_CONSULT_PHONE} · ${MITTWALD_SALES_URL} · Support: https://www.mittwald.de/darum-mittwald/kundenservice\n\n` +
    liveTariffsSection +
    `\n\n` +
    formatPlaygroundAiHostingDedicatedSalesContext() +
    `\n\n` +
    formatPlaygroundAiHostingContainerTemplatesContext() +
    `\n\n## Verfügbare Modelle (live, Developer-Doku)\n` +
    (data.modelsPage.intro.length ? `${data.modelsPage.intro.join(" ")}\n\n` : "") +
    modelLines.join("\n\n") +
    `\n\n## Modell-Empfehlungen (Doku)\n` +
    recLines.join("\n") +
    (data.modelsPage.tip ? `\n\nTipp (Doku): ${data.modelsPage.tip}` : "") +
    `\n\n` +
    formatPlaygroundMittwaldContext() +
    `\n\n` +
    formatPlaygroundAiHostingTariffFaqContext()
  );
}
