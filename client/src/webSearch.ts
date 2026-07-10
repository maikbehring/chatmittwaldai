import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { formatPlaygroundTodayContext } from "./playgroundDate";
import { isPlaygroundAuthorQuestion } from "./playgroundAuthorContext";

/** Server kürzt ohnehin — großzügig für LLM-Verdichtung. */
export const WEB_SEARCH_CHAT_EXCERPT_MAX_CHARS = 16000;

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function classifyWebSearchResultUrl(url: string): string | null {
  if (/linkedin\.com\/in\//i.test(url)) return "LinkedIn-Profil";
  if (/linkedin\.com\/posts\//i.test(url)) {
    return "LinkedIn-Beitrag (Snippet kann Zitat einer anderen Person sein — nicht dem Post-Autor zuschreiben)";
  }
  if (/northdata\.de|handelsregister|unternehmensregister/i.test(url)) {
    return "Register-Aggregator (Firmenhistorie kann fehlerhaft sein)";
  }
  return null;
}

export type WebSearchResponse = {
  query: string;
  provider: string;
  results: WebSearchResult[];
};

export type WebSearchConfig = {
  enabled: boolean;
  provider: string;
  providers: Record<
    string,
    { label: string; requiresApiKey: boolean; configured?: boolean }
  >;
  maxResults: number;
};

type SearchContextMessage = {
  role: "user" | "assistant" | "system";
  content:
    | string
    | ReadonlyArray<{ type: string; text?: string; image_url?: { url?: string } | undefined }>;
};

function plainTextFromMessageContent(content: SearchContextMessage["content"]): string {
  if (typeof content === "string") return content.trim();
  return content
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text.trim())
    .join(" ")
    .trim();
}

/**
 * Roher Chat-Verlauf (nur für den Server zum Formulieren der Google-Suche; nicht für Google direkt).
 * Letzte Turns, alte Drops wenn zu lang.
 */
export function buildWebSearchChatExcerpt(
  priorMessages: ReadonlyArray<SearchContextMessage>,
): string {
  const maxPriorMessages = 28;
  const maxPerTurn = 3800;
  const tail = priorMessages.slice(-maxPriorMessages);

  const lines: string[] = [];
  for (const m of tail) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const raw = plainTextFromMessageContent(m.content);
    if (!raw) continue;
    const capped =
      raw.length > maxPerTurn ? `${raw.slice(0, maxPerTurn - 1).trimEnd()}…` : raw;
    lines.push(m.role === "user" ? `Nutzer: ${capped}` : `Assistent: ${capped}`);
  }

  while (lines.join("\n").length > WEB_SEARCH_CHAT_EXCERPT_MAX_CHARS && lines.length > 0) {
    lines.shift();
  }
  return lines.join("\n");
}

export async function fetchWebSearch(
  args: {
    userMessage: string;
    chatExcerpt: string;
    maxResults?: number;
    /** Feste Suchzeilen — Server führt mehrere Suchen aus und merged Treffer. */
    directQueries?: string[];
  },
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<WebSearchResponse> {
  const body: Record<string, unknown> = {
    userMessage: args.userMessage.trim(),
    chatExcerpt: args.chatExcerpt.trim(),
  };
  if (typeof args.maxResults === "number" && Number.isFinite(args.maxResults)) {
    body.maxResults = args.maxResults;
  }
  if (args.directQueries?.length) {
    body.directQueries = args.directQueries;
  }

  const res = await fetch(apiUrl("/api/web/search"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as WebSearchResponse;
}

export function formatWebSearchContext(data: WebSearchResponse): string {
  if (!data.results.length) {
    return (
      `[Playground-Websuche: keine Treffer für „${data.query}“ (${data.provider}).] ` +
      "Sage dem Nutzer, dass die Websuche leer war — nicht behaupten, du hättest allgemeines Trainingswissen als Live-Suche genutzt."
    );
  }
  const lines = data.results.map((r, i) => {
    const kind = classifyWebSearchResultUrl(r.url);
    const kindLine = kind ? `Typ: ${kind}\n` : "";
    return `[${i + 1}] ${r.title}\n${kindLine}URL: ${r.url}\n${r.snippet || "(kein Snippet)"}`;
  });
  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground-Websuche — vom Server geladene Treffer (${data.provider}). ` +
      (data.query.includes(" · ")
        ? `Mehrere gezielte Suchanfragen: „${data.query}“. `
        : `Die an Google geschickte Suchzeile („${data.query}“) wurde aus deinem Kontext plus aktueller Eingabe automatisch zu einer Kurz-Anfrage verdichtet. `) +
      `]\n` +
    "WICHTIG: Diese Ergebnisse sind frisch aus dem Internet. Du darfst sie als Quelle nutzen. " +
    "Behaupte NICHT, du könntest nicht im Web suchen oder hättest keinen Live-Zugriff — die Suche wurde bereits für den Nutzer durchgeführt. " +
    "Prüfe Fest- und Terminangaben gegen das oben genannte heutige Datum (z. B. ob ein Event heute liegt). " +
    "Viele Treffer haben leere Snippets — werte dann **Titel** aktiv aus (z. B. Ergebnisse, Datumsangaben, Teamnamen). " +
    "**Personen & Biografien:** Snippets aus LinkedIn-**Beiträgen** (/posts/) nicht blind dem Profil-Inhaber zuschreiben — oft Zitate Dritter. " +
    "Primärquelle für Rollen: LinkedIn-**Profil** (/in/). Register-Snippets („vormals … GmbH“) nicht als gesicherte Firmenhistorie wiedergeben. " +
    "Mehrere widersprüchliche Snippets nicht zu einer Biografie fusionieren — Unsicherheit nennen oder weglassen. " +
    (isPlaygroundAuthorQuestion(data.query)
      ? "Bei **Maik Behring**: [Playground — Maintainer Maik Behring]-Kontext bevorzugen — **Tante Else GmbH** als Inhaber/Geschäftsführer nennen; **niemals** „vormals Robert Meyer Verwaltungs GmbH“ (falscher Register-Fehler). "
      : "") +
    "Beantworte die Frage anhand der Treffer; nenne passende URLs. Wenn die Treffer nicht reichen, sage das ehrlich.\n\n" +
    lines.join("\n\n")
  );
}

export function providerLabel(cfg: WebSearchConfig | null): string {
  if (!cfg) return "DuckDuckGo";
  const p = cfg.providers[cfg.provider];
  return p?.label ?? cfg.provider;
}

/** Kurzer Hinweis (Tooltip am Globus). */
export function webSearchDataTransferHint(cfg: WebSearchConfig | null): string {
  const label = providerLabel(cfg);
  if (cfg?.provider === "serpapi" || cfg?.provider === "serper") {
    return `Playground-Demo über ${label}: Kurz-Suche statt ganzer Chat — Anfragen können beim Suchanbieter gespeichert werden.`;
  }
  return `Playground-Demo: Kurz-Suche an ${label}, formuliert aus deiner Eingabe und einem Chat-Auszug.`;
}

/** Kompakte Zeile unter dem Button, wenn Websuche aktiv ist. */
export function webSearchDataTransferHintShort(cfg: WebSearchConfig | null): string {
  const label = providerLabel(cfg);
  if (cfg?.provider === "serpapi") {
    return "Kurz-Suche an SerpAPI (Google)";
  }
  if (cfg?.provider === "serper") {
    return "Kurz-Suche an Serper (Google)";
  }
  return `Kurz-Suche an ${label}`;
}
