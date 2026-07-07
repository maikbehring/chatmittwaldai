/**
 * Quellen-Klassifikation und Zuverlässigkeit für Websuche-Treffer.
 * Hilft dem LLM, Snippet-Fehler (LinkedIn-Zitate, Register-Aggregatoren) zu erkennen.
 */

/** @typedef {"high" | "medium" | "low"} SearchReliability */

/** @typedef {{
 *   kind: string;
 *   reliability: SearchReliability;
 *   caveat: string | null;
 * }} SearchResultAnnotation */

/**
 * @param {{ url: string; title?: string; snippet?: string }} result
 * @returns {SearchResultAnnotation}
 */
export function annotateSearchResult(result) {
  const url = String(result.url ?? "");
  const title = String(result.title ?? "");
  const snippet = String(result.snippet ?? "");
  const text = `${title} ${snippet}`.toLowerCase();

  if (/linkedin\.com\/in\//i.test(url)) {
    return {
      kind: "linkedin-profile",
      reliability: "high",
      caveat: "Profilseite — für Rollen/Titel bevorzugen, aber nur was im Snippet/Titel steht.",
    };
  }

  if (/linkedin\.com\/posts\//i.test(url)) {
    const quotedRole =
      /\b(co-?founder|gründer|geschäftsführer|ceo|cto)\b/i.test(snippet) &&
      /\bbeitrag von\b/i.test(title + snippet);
    return {
      kind: "linkedin-post",
      reliability: "low",
      caveat: quotedRole
        ? "LinkedIn-Beitrag: Snippet kann Zitat/Profilzeile einer anderen Person sein — nicht dem Post-Autor zuschreiben."
        : "LinkedIn-Beitrag: Snippet kann fremden Text oder Kommentare enthalten — nicht als Profil-Fakt werten.",
    };
  }

  if (/northdata\.de|handelsregister|unternehmensregister|implisense|companyhouse/i.test(url)) {
    return {
      kind: "register-aggregator",
      reliability: "low",
      caveat:
        "Register-/Firmenaggregator: „vormals … GmbH“ und Netzwerk-Angaben können veraltet oder falsch sein — Primärquelle nötig.",
    };
  }

  if (/wikipedia\.org/i.test(url)) {
    return {
      kind: "wikipedia",
      reliability: "medium",
      caveat: "Wikipedia — guter Überblick; für heikle Biografie-/Firmenfakten Originalquellen prüfen.",
    };
  }

  if (/reddit\.com|quora\.com|gutefrage\.net|stackoverflow\.com/i.test(url)) {
    return {
      kind: "forum",
      reliability: "low",
      caveat: "Forum/Community — subjektiv oder veraltet; nicht als Primärquelle.",
    };
  }

  if (/\.(gov|edu)(\/|$)/i.test(url) || /bund\.de|europa\.eu|destatis\.de|uba\.de|bahn\.de/i.test(url)) {
    return {
      kind: "official",
      reliability: "high",
      caveat: null,
    };
  }

  if (/youtube\.com|youtu\.be|instagram\.com|facebook\.com|x\.com|twitter\.com/i.test(url)) {
    return {
      kind: "social-media",
      reliability: "low",
      caveat: "Social-Media — oft Marketing oder Zitate; nur mit Vorsicht für Fakten nutzen.",
    };
  }

  if (
    /theverge\.com|heise\.de|spiegel\.de|zeit\.de|faz\.net|sueddeutsche\.de|tagesschau\.de|n-tv\.de|golem\.de/i.test(
      url,
    )
  ) {
    return {
      kind: "news",
      reliability: "medium",
      caveat: "Nachrichtenquelle — Datum prüfen (heutiges Datum im Kontext).",
    };
  }

  if (/amazon\.|ebay\.|idealo\.|geizhals\.|google\.com\/shopping/i.test(url)) {
    return {
      kind: "commerce",
      reliability: "medium",
      caveat: "Shop/Preisvergleich — Preise und Verfügbarkeit können sich schnell ändern.",
    };
  }

  if (/\bvormals\b/i.test(snippet) || /\bformerly\b/i.test(snippet)) {
    return {
      kind: "other",
      reliability: "low",
      caveat: "Snippet enthält „vormals/formerly“ — historische Zuordnung kann falsch sein.",
    };
  }

  if (!snippet.trim()) {
    return {
      kind: "other",
      reliability: "medium",
      caveat: "Kein Snippet — nur Titel/URL auswerten, nichts ergänzen.",
    };
  }

  return { kind: "other", reliability: "medium", caveat: null };
}

/** @param {SearchReliability} a @param {SearchReliability} b */
function reliabilityRank(a) {
  if (a === "high") return 0;
  if (a === "medium") return 1;
  return 2;
}

/**
 * Zuverlässigere Treffer zuerst — innerhalb gleicher Stufe Original-Reihenfolge.
 * @template {{ reliability?: SearchReliability }} T
 * @param {T[]} results
 * @returns {T[]}
 */
export function sortSearchResultsByReliability(results) {
  return results
    .map((r, index) => ({ r, index }))
    .sort((a, b) => {
      const diff =
        reliabilityRank(a.r.reliability ?? "medium") - reliabilityRank(b.r.reliability ?? "medium");
      return diff !== 0 ? diff : a.index - b.index;
    })
    .map(({ r }) => r);
}
