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
      `Websuche (${data.provider}) für „${data.query}“: keine Treffer. ` +
      "Antworte trotzdem hilfreich und weise darauf hin, dass keine aktuellen Web-Treffer geladen wurden."
    );
  }
  const lines = data.results.map(
    (r, i) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet || "(kein Snippet)"}`,
  );
  return (
    `Aktuelle Websuchergebnisse (${data.provider}, Anfrage: „${data.query}“). ` +
    "Nutze diese Informationen für deine Antwort, nenne relevante Quellen mit URL wenn sinnvoll. " +
    "Wenn die Treffer nicht passen, sage das ehrlich.\n\n" +
    lines.join("\n\n")
  );
}

export function providerLabel(cfg: WebSearchConfig | null): string {
  if (!cfg) return "DuckDuckGo";
  const p = cfg.providers[cfg.provider];
  return p?.label ?? cfg.provider;
}
