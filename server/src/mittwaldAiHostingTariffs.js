/**
 * Live-Tarife von mittwald.de/mstudio/ai-hosting (HTML).
 * @see https://www.mittwald.de/mstudio/ai-hosting
 */

const TARIFFS_PAGE_URL = "https://www.mittwald.de/mstudio/ai-hosting";
const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = null;
let cacheAt = 0;

const PLAN_MARKERS = [
  { displayName: "Starter", marker: "Starter</span></h2>" },
  { displayName: "Pro", marker: "Pro</span></h2>" },
  { displayName: "Business", marker: "Business</span></h2>" },
  {
    displayName: "Enterprise Dedicated",
    marker: "Managed Dedicated</span></h2>",
  },
];

/** Zeichen vor dem Plan-Titel — Preis steht auf der Seite oberhalb der h2-Überschrift. */
const PLAN_PRICE_LOOKBACK = 1200;

function decodeHtml(s) {
  return String(s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeHtml(String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parsePlanChunk(chunk, displayName, markerOffset) {
  const planBody = markerOffset >= 0 ? chunk.slice(markerOffset) : chunk;
  const priceMatch =
    chunk.match(/headline__block'>ab ([0-9]+ €)<\/span>/) ??
    chunk.match(/<strong>([0-9]+ €)<\/strong>/);
  const taglineMatch =
    planBody.match(/<p><strong>([^<]*)<\/strong>/) ??
    planBody.match(
      /<div class="cc cc--mw-navy atom text text--size-m"><div class="text__inner"><p>([^<]*)<\/p>/,
    );
  const features = [
    ...planBody.matchAll(/<div class="label__inner"><p>([^<]*)<\/p><\/div>/g),
  ]
    .map((m) => stripTags(m[1]))
    .filter(Boolean);

  return {
    name: displayName,
    priceMonthly: priceMatch?.[1] ?? null,
    tagline: taglineMatch ? stripTags(taglineMatch[1]) : "",
    features,
  };
}

function parseTariffPlans(html) {
  const positions = PLAN_MARKERS.map((p) => ({
    ...p,
    index: html.indexOf(p.marker),
  })).filter((p) => p.index >= 0);

  positions.sort((a, b) => a.index - b.index);

  return positions.map((pos, i) => {
    const start = Math.max(0, pos.index - PLAN_PRICE_LOOKBACK);
    const end = positions[i + 1]?.index ?? pos.index + 12_000;
    const chunk = html.slice(start, end);
    return parsePlanChunk(chunk, pos.displayName, pos.index - start);
  });
}

function parseContractNotes(html) {
  const section = html.indexOf("Vertragslaufzeit");
  if (section < 0) return [];
  const chunk = html.slice(section - 200, section + 2_000);
  return [...chunk.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 0 && t.length < 120);
}

export async function fetchMittwaldAiHostingTariffs() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  try {
    const res = await fetch(TARIFFS_PAGE_URL, {
      headers: { "User-Agent": "mittwald-ai-playground", Accept: "text/html" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`Tarifseite HTTP ${res.status}`);
      return buildTariffsPayload([], [], `Tarifseite nicht erreichbar (HTTP ${res.status}).`);
    }

    const html = await res.text();
    const plans = parseTariffPlans(html);
    if (plans.length === 0) {
      console.warn("Tarifseite konnte nicht geparst werden.");
      return buildTariffsPayload([], [], "Tarifseite konnte nicht geparst werden.");
    }

    const payload = buildTariffsPayload(plans, parseContractNotes(html));
    cache = payload;
    cacheAt = now;
    return payload;
  } catch (e) {
    console.warn("Tarifseite laden fehlgeschlagen:", e);
    const message = e instanceof Error ? e.message : "Tarifseite nicht geladen.";
    return buildTariffsPayload([], [], message);
  }
}

function buildTariffsPayload(plans, contractNotes, parseWarning = null) {
  return {
    fetchedAt: new Date().toISOString(),
    url: TARIFFS_PAGE_URL,
    plans,
    contractNotes,
    live: plans.length > 0,
    parseWarning,
  };
}
