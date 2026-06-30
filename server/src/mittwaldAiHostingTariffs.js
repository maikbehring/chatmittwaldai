/**
 * Live-Tarife von mittwald.de/mstudio/ai-hosting (HTML).
 * @see https://www.mittwald.de/mstudio/ai-hosting
 */

const TARIFFS_PAGE_URL = "https://www.mittwald.de/mstudio/ai-hosting";
const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = null;
let cacheAt = 0;

const PLAN_MARKERS = [
  { displayName: "Starter", marker: "Starter</span></h3>" },
  { displayName: "Pro", marker: ">Pro</span></h3>" },
  { displayName: "Business", marker: "Business</span></h3>" },
  {
    displayName: "Enterprise Dedicated",
    marker: '<div class="label__inner">ENTERPRISE</div></div></div><div class="content-flow',
  },
];

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

function parsePlanChunk(chunk, displayName) {
  const priceMatch = chunk.match(/<strong>([0-9]+ €)<\/strong>/);
  const taglineMatch = chunk.match(
    /<div class="cc cc--mw-navy atom text text--size-m"><div class="text__inner"><p>([^<]*)<\/p>/,
  );
  const features = [
    ...chunk.matchAll(/<div class="label__inner"><p>([^<]*)<\/p><\/div>/g),
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
    const end = positions[i + 1]?.index ?? pos.index + 12_000;
    const chunk = html.slice(pos.index, end);
    return parsePlanChunk(chunk, pos.displayName);
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

  const res = await fetch(TARIFFS_PAGE_URL, {
    headers: { "User-Agent": "mittwald-ai-playground", Accept: "text/html" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Tarifseite ${res.status}`);

  const html = await res.text();
  const plans = parseTariffPlans(html);
  if (plans.length === 0) {
    throw new Error("Tarifseite konnte nicht geparst werden.");
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    url: TARIFFS_PAGE_URL,
    plans,
    contractNotes: parseContractNotes(html),
  };

  cache = payload;
  cacheAt = now;
  return payload;
}
