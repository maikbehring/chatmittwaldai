import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { formatPlaygroundTodayContext } from "./playgroundDate";
import type { WebSearchResult } from "./webSearch";

export type PriceCompareSearchResult = WebSearchResult & {
  searchRound?: number;
};

export type PriceCompareSearchResponse = {
  product: string;
  providerA: string;
  providerB: string;
  provider: string;
  roundsCompleted: number;
  totalRounds: number;
  sufficient: boolean;
  usefulCount: number;
  results: PriceCompareSearchResult[];
  fetchedAt: string;
};

export async function fetchPriceCompareRound(
  args: {
    product: string;
    providerA: string;
    providerB: string;
    roundIndex: number;
    priorResults: PriceCompareSearchResult[];
  },
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<{
  roundIndex: number;
  queries: string[];
  provider: string;
  newResults: PriceCompareSearchResult[];
  combined: PriceCompareSearchResult[];
  sufficient: boolean;
  usefulCount: number;
}> {
  const res = await fetch(apiUrl("/api/price-compare/round"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(args),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as {
    roundIndex: number;
    queries: string[];
    provider: string;
    newResults: PriceCompareSearchResult[];
    combined: PriceCompareSearchResult[];
    sufficient: boolean;
    usefulCount: number;
  };
}

const MAX_PRICE_COMPARE_ROUNDS = 4;

export async function searchPriceCompareIterative(
  args: {
    product: string;
    providerA: string;
    providerB: string;
  },
  options?: {
    signal?: AbortSignal;
    rateLimits?: PlaygroundRateLimits | null;
    onRound?: (round: number, totalRounds: number) => void;
  },
): Promise<PriceCompareSearchResponse> {
  const product = args.product.trim();
  const providerA = args.providerA.trim();
  const providerB = args.providerB.trim();
  let combined: PriceCompareSearchResult[] = [];
  let provider = "duckduckgo";
  let roundsCompleted = 0;
  let sufficient = false;

  for (let i = 0; i < MAX_PRICE_COMPARE_ROUNDS; i++) {
    options?.onRound?.(i + 1, MAX_PRICE_COMPARE_ROUNDS);
    const step = await fetchPriceCompareRound(
      {
        product,
        providerA,
        providerB,
        roundIndex: i,
        priorResults: combined,
      },
      options?.signal,
      options?.rateLimits,
    );
    provider = step.provider;
    combined = step.combined;
    roundsCompleted = i + 1;
    sufficient = step.sufficient;
    if (sufficient) break;
  }

  const usefulCount = combined.filter((r) =>
    /€|eur|preis|price|\d+[,.]\d{2}/i.test(`${r.title} ${r.snippet}`),
  ).length;

  return {
    product,
    providerA,
    providerB,
    provider,
    roundsCompleted,
    totalRounds: MAX_PRICE_COMPARE_ROUNDS,
    sufficient,
    usefulCount,
    results: combined.slice(0, 20),
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchPriceCompareSearch(
  args: {
    product: string;
    providerA: string;
    providerB: string;
  },
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<PriceCompareSearchResponse> {
  const res = await fetch(apiUrl("/api/price-compare/search"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      product: args.product.trim(),
      providerA: args.providerA.trim(),
      providerB: args.providerB.trim(),
    }),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as PriceCompareSearchResponse;
}

export function formatPriceCompareContext(data: PriceCompareSearchResponse): string {
  if (!data.results.length) {
    return (
      `[Playground — Preisvergleich: keine Websuche-Treffer für „${data.product}" ` +
      `(${data.providerA} vs. ${data.providerB}).] ` +
      "Sage dem Nutzer ehrlich, dass keine Preisinformationen gefunden wurden."
    );
  }

  const lines = data.results.map((r, i) => {
    const priceHint = /€|eur|preis|price|\d+[,.]\d{2}/i.test(`${r.title} ${r.snippet}`)
      ? " [Preis-Hinweis im Titel/Snippet]"
      : "";
    return (
      `[${i + 1}] Runde ${r.searchRound ?? "?"}${priceHint}\n` +
      `${r.title}\nURL: ${r.url}\n${r.snippet || "(kein Snippet)"}`
    );
  });

  const quality = data.sufficient
    ? `Ausreichend für Vergleich (${data.usefulCount} Treffer mit Preis-Hinweisen, ${data.roundsCompleted}/${data.totalRounds} Suchrunden).`
    : `Begrenzte Datenlage (${data.usefulCount} Preis-Treffer nach ${data.roundsCompleted} Runden) — nur sichere Angaben, Rest als unklar markieren.`;

  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground — Preisvergleich-Websuche (${data.provider}). ` +
    `Produkt: „${data.product}". Anbieter A: „${data.providerA}". Anbieter B: „${data.providerB}". ` +
    `${quality}]\n` +
    "WICHTIG: Nur Preise und Fakten aus den Treffern — nichts erfinden. " +
    "Ordne jeden Treffer dem passenden Anbieter zu (URL/Titel). " +
    "Wenn kein klarer Preis im Snippet steht, schätze nicht — schreibe „Preis auf Seite prüfen“ mit Link.\n\n" +
    lines.join("\n\n")
  );
}
