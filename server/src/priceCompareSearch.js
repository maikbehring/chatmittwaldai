/**
 * Iterative Websuche für Preisvergleich (Produkt × zwei Anbieter).
 */

import { getWebSearchConfig, searchWebMulti } from "./webSearch.js";

const MAX_ROUNDS = 4;
const MIN_USEFUL_WITH_PRICE = 2;
const MIN_TOTAL_RESULTS = 5;

const PRICE_SIGNAL_RE =
  /€|\beur\b|\d{1,4}[,.]\d{2}\s*€|preis|uvp|angebot|kosten|price|ab\s+\d|nur\s+\d/i;

export function hasPriceSignals(result) {
  const text = `${result.title ?? ""} ${result.snippet ?? ""}`;
  return PRICE_SIGNAL_RE.test(text);
}

export function countUsefulPriceResults(results) {
  return results.filter(hasPriceSignals).length;
}

function providerMatch(result, provider) {
  const p = String(provider ?? "").trim().toLowerCase();
  if (!p) return false;
  const text = `${result.title ?? ""} ${result.snippet ?? ""} ${result.url ?? ""}`.toLowerCase();
  if (text.includes(p)) return true;
  const tokens = p.split(/[\s.\-]+/).filter((t) => t.length > 3);
  return tokens.some((t) => text.includes(t));
}

/**
 * @param {string} product
 * @param {string} providerA
 * @param {string} providerB
 * @returns {string[][]}
 */
export function buildPriceCompareQueryRounds(product, providerA, providerB) {
  const prod = String(product ?? "").trim();
  const a = String(providerA ?? "").trim();
  const b = String(providerB ?? "").trim();
  return [
    [`${a} ${prod} Preis`, `${b} ${prod} Preis`, `${prod} Preisvergleich ${a} ${b}`],
    [`${prod} kaufen ${a}`, `${prod} kaufen ${b}`, `${prod} Angebot`],
    [`${a} ${prod}`, `${b} ${prod} Shop`],
    [`${prod} ${a} EUR`, `${prod} ${b} EUR Preis aktuell`],
  ];
}

/**
 * @param {Array<{ title?: string; snippet?: string; url?: string }>} results
 * @param {string} providerA
 * @param {string} providerB
 */
export function isPriceCompareSufficient(results, providerA, providerB) {
  const useful = results.filter(hasPriceSignals);
  if (useful.length < MIN_USEFUL_WITH_PRICE) return false;

  const hitA = useful.some((r) => providerMatch(r, providerA));
  const hitB = useful.some((r) => providerMatch(r, providerB));
  if (hitA && hitB) return true;

  return useful.length >= 4 && results.length >= MIN_TOTAL_RESULTS;
}

/**
 * @param {{
 *   product: string;
 *   providerA: string;
 *   providerB: string;
 *   roundIndex: number;
 *   excludeUrls?: string[];
 * }} opts
 */
export async function runPriceCompareSearchRound(opts) {
  const product = String(opts.product ?? "").trim();
  const providerA = String(opts.providerA ?? "").trim();
  const providerB = String(opts.providerB ?? "").trim();
  const roundIndex = Number(opts.roundIndex) || 0;

  if (!product || !providerA || !providerB) {
    throw new Error("Produkt und beide Anbieter sind erforderlich.");
  }

  const rounds = buildPriceCompareQueryRounds(product, providerA, providerB);
  const queries = rounds[roundIndex];
  if (!queries?.length) {
    return {
      roundIndex,
      queries: [],
      provider: getWebSearchConfig().provider,
      results: [],
    };
  }

  const exclude = new Set(
    (opts.excludeUrls ?? []).map((u) => String(u).toLowerCase()).filter(Boolean),
  );

  const data = await searchWebMulti(queries, { maxResults: 12 });
  const results = data.results.filter((r) => !exclude.has(r.url.toLowerCase()));

  return {
    roundIndex,
    queries,
    provider: data.provider,
    results,
  };
}

/**
 * @param {{
 *   product: string;
 *   providerA: string;
 *   providerB: string;
 *   onRound?: (info: { round: number; totalRounds: number }) => void | Promise<void>;
 * }} opts
 */
export async function searchPriceCompareUntilUseful(opts) {
  const product = String(opts.product ?? "").trim();
  const providerA = String(opts.providerA ?? "").trim();
  const providerB = String(opts.providerB ?? "").trim();

  if (product.length < 2) throw new Error("Bitte ein Produkt angeben.");
  if (providerA.length < 2 || providerB.length < 2) {
    throw new Error("Bitte zwei Anbieter angeben.");
  }

  const totalRounds = Math.min(buildPriceCompareQueryRounds(product, providerA, providerB).length, MAX_ROUNDS);
  const combined = [];
  const seen = new Set();
  let provider = getWebSearchConfig().provider;
  let roundsCompleted = 0;
  let sufficient = false;

  for (let i = 0; i < totalRounds; i++) {
    roundsCompleted = i + 1;
    if (opts.onRound) {
      await opts.onRound({ round: roundsCompleted, totalRounds });
    }

    const step = await runPriceCompareSearchRound({
      product,
      providerA,
      providerB,
      roundIndex: i,
      excludeUrls: [...seen],
    });
    provider = step.provider;

    for (const r of step.results) {
      const key = r.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push({ ...r, searchRound: roundsCompleted });
    }

    if (isPriceCompareSufficient(combined, providerA, providerB)) {
      sufficient = true;
      break;
    }
  }

  const usefulCount = combined.filter(hasPriceSignals).length;

  return {
    product,
    providerA,
    providerB,
    provider,
    roundsCompleted,
    totalRounds,
    sufficient,
    usefulCount,
    results: combined.slice(0, 20),
    fetchedAt: new Date().toISOString(),
  };
}
