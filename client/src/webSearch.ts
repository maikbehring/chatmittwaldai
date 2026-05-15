export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

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

export async function fetchWebSearch(
  query: string,
  signal?: AbortSignal,
): Promise<WebSearchResponse> {
  const res = await fetch("/api/web/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: query }),
    signal,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      msg = j.error?.message ?? msg;
    } catch {
      msg = (await res.text()).slice(0, 500) || msg;
    }
    throw new Error(msg);
  }
  return (await res.json()) as WebSearchResponse;
}

export function formatWebSearchContext(data: WebSearchResponse): string {
  if (!data.results.length) {
    return (
      `[Playground-Websuche: keine Treffer für „${data.query}“ (${data.provider}).] ` +
      "Sage dem Nutzer, dass die Websuche leer war — nicht behaupten, du hättest allgemeines Trainingswissen als Live-Suche genutzt."
    );
  }
  const lines = data.results.map(
    (r, i) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet || "(kein Snippet)"}`,
  );
  return (
    `[Playground-Websuche — vom Server geladene Treffer (${data.provider}), Anfrage: „${data.query}“]\n` +
    "WICHTIG: Diese Ergebnisse sind frisch aus dem Internet. Du darfst sie als Quelle nutzen. " +
    "Behaupte NICHT, du könntest nicht im Web suchen oder hättest keinen Live-Zugriff — die Suche wurde bereits für den Nutzer durchgeführt. " +
    "Beantworte die Frage anhand der Treffer; nenne passende URLs. Wenn die Treffer nicht reichen, sage das ehrlich.\n\n" +
    lines.join("\n\n")
  );
}

export function providerLabel(cfg: WebSearchConfig | null): string {
  if (!cfg) return "DuckDuckGo";
  const p = cfg.providers[cfg.provider];
  return p?.label ?? cfg.provider;
}
