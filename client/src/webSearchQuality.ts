export type SearchReliability = "high" | "medium" | "low";

export type WebSearchResultQuality = {
  kind?: string;
  reliability?: SearchReliability;
  caveat?: string | null;
};

const KIND_LABELS: Record<string, string> = {
  "linkedin-profile": "LinkedIn-Profil",
  "linkedin-post": "LinkedIn-Beitrag",
  "register-aggregator": "Register-Aggregator",
  wikipedia: "Wikipedia",
  forum: "Forum/Community",
  official: "Offizielle Quelle",
  "social-media": "Social Media",
  news: "Nachrichten",
  commerce: "Shop/Preis",
  other: "Web",
};

const RELIABILITY_LABELS: Record<SearchReliability, string> = {
  high: "hoch",
  medium: "mittel",
  low: "niedrig",
};

export function formatSearchResultKindLabel(kind: string | undefined): string | null {
  if (!kind) return null;
  return KIND_LABELS[kind] ?? kind;
}

export function formatSearchResultReliabilityLabel(
  reliability: SearchReliability | undefined,
): string | null {
  if (!reliability) return null;
  return RELIABILITY_LABELS[reliability];
}

/** Allgemeine Antwort-Regeln für alle Websuche-Antworten im Playground. */
export const WEB_SEARCH_ANSWER_RULES = `## Antwort-Regeln (Websuche — allgemein)
- Nutze **nur** Informationen aus den nummerierten Treffern unten; nichts aus Trainingswissen als „Live-Suche“ ausgeben.
- **Jede konkrete Aussage** mit Quelle belegen: „laut [n] …“ oder URL nennen.
- Snippets sind **Auszüge** — nicht den ganzen Artikel erfinden; fehlende Details als unbekannt markieren.
- **Widersprüchliche Treffer** nicht zu einer Geschichte verschmelzen — Unsicherheit benennen oder den zuverlässigeren Treffer bevorzugen (siehe Zuverlässigkeit).
- Treffer mit **niedriger Zuverlässigkeit** (z. B. LinkedIn-Beiträge, Register-Aggregatoren, Foren) nur vorsichtig formulieren („laut Snippet …, nicht verifiziert“).
- **LinkedIn:** \`/in/\` = Profil; \`/posts/\` = Beitrag (Snippet kann **fremdes Zitat** sein — nicht dem Autor zuschreiben).
- **Register/Handelsregister-Snippets** („vormals … GmbH“): nicht als gesicherte Firmenhistorie wiedergeben.
- Leere Snippets: nur **Titel** auswerten — keine Fantasie-Fakten.
- Datum/Fristen gegen das heutige Datum im Kontext prüfen.`;
