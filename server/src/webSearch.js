/**
 * Websuche für den Playground.
 * Standard: DuckDuckGo (ohne API-Key). Optional: Serper (WEB_SEARCH_SERPER_API_KEY).
 */

const MAX_QUERY_LEN = 400;
const DEFAULT_MAX_RESULTS = 5;

function decodeHtml(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeResults(items, maxResults) {
  return items
    .filter((r) => r.url && r.title)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title.slice(0, 300),
      url: r.url.slice(0, 2000),
      snippet: (r.snippet ?? "").slice(0, 600),
    }));
}

/** DuckDuckGo HTML-Suche (kostenlos, ohne Key). */
async function searchDuckDuckGo(query, maxResults) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MittwaldKIPlayground/1.0; +https://github.com/maikbehring/chatmittwaldai)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`DuckDuckGo antwortete mit ${res.status}.`);

  const html = await res.text();
  const results = [];
  const linkRe =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let m;
  const seen = new Set();
  while ((m = linkRe.exec(html)) !== null && results.length < maxResults + 2) {
    let href = decodeHtml(m[1]);
    if (href.startsWith("//")) href = `https:${href}`;
    if (!href.startsWith("http") || seen.has(href)) continue;
    seen.add(href);
    const title = decodeHtml(m[2]);
    if (!title) continue;

    const after = html.slice(m.index, m.index + 1200);
    const snippetMatch =
      after.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ??
      after.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//i);
    const snippet = snippetMatch ? decodeHtml(snippetMatch[1]) : "";

    results.push({ title, url: href, snippet });
  }

  return normalizeResults(results, maxResults);
}

/** Serper (Google) — optional mit API-Key. */
async function searchSerper(query, maxResults, apiKey) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: maxResults }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 200) || `Serper ${res.status}`);
  }
  const json = await res.json();
  const organic = Array.isArray(json?.organic) ? json.organic : [];
  return normalizeResults(
    organic.map((o) => ({
      title: String(o.title ?? ""),
      url: String(o.link ?? ""),
      snippet: String(o.snippet ?? ""),
    })),
    maxResults,
  );
}

export function getWebSearchConfig() {
  const provider = (process.env.WEB_SEARCH_PROVIDER || "duckduckgo").toLowerCase();
  const serperKey = process.env.WEB_SEARCH_SERPER_API_KEY?.trim() || "";
  const maxResults = Math.min(
    Math.max(Number(process.env.WEB_SEARCH_MAX_RESULTS || DEFAULT_MAX_RESULTS), 1),
    10,
  );
  const effectiveProvider =
    provider === "serper" && serperKey ? "serper" : "duckduckgo";
  return {
    enabled: true,
    provider: effectiveProvider,
    providers: {
      duckduckgo: { label: "DuckDuckGo", requiresApiKey: false },
      serper: { label: "Serper (Google)", requiresApiKey: true, configured: Boolean(serperKey) },
    },
    maxResults,
  };
}

export async function searchWeb(rawQuery, options = {}) {
  const query = String(rawQuery ?? "").trim();
  if (!query) return { query: "", provider: "duckduckgo", results: [] };
  if (query.length > MAX_QUERY_LEN) {
    throw new Error(`Suchanfrage zu lang (max. ${MAX_QUERY_LEN} Zeichen).`);
  }

  const cfg = getWebSearchConfig();
  const maxResults = Math.min(options.maxResults ?? cfg.maxResults, 10);

  let results;
  if (cfg.provider === "serper") {
    const key = process.env.WEB_SEARCH_SERPER_API_KEY?.trim();
    if (!key) throw new Error("Serper ist gewählt, aber WEB_SEARCH_SERPER_API_KEY fehlt.");
    results = await searchSerper(query, maxResults, key);
  } else {
    results = await searchDuckDuckGo(query, maxResults);
  }

  return { query, provider: cfg.provider, results };
}
