/**
 * Websuche für den Playground.
 * Standard: DuckDuckGo (ohne API-Key).
 * Optional: SerpAPI (Google), Serper (Google) — jeweils per API-Key in .env.
 */

const MAX_QUERY_LEN = 2000;
const DEFAULT_MAX_RESULTS = 5;

/** Finale Sicherung: Google/SerpAPI nutzen kurze Queries besser. */
const SEARCH_ENGINE_MAX_WORDS = 12;
const SEARCH_ENGINE_MAX_CHARS = 150;

function normalizeSearchEngineQuery(raw) {
  let s = String(raw ?? "")
    .replace(/\*\*?/g, " ")
    .replace(/`+/g, " ")
    .replace(/#{1,6}\s*|_{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let words = s.split(/\s+/).filter(Boolean);
  if (words.length > SEARCH_ENGINE_MAX_WORDS) words = words.slice(0, SEARCH_ENGINE_MAX_WORDS);
  s = words.join(" ");
  if (s.length > SEARCH_ENGINE_MAX_CHARS) {
    s = s.slice(0, SEARCH_ENGINE_MAX_CHARS).trimEnd();
    const cut = s.lastIndexOf(" ");
    if (cut > 50) s = s.slice(0, cut).trimEnd();
  }
  return s;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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

/** DuckDuckGo-Weiterleitungen in echte Ziel-URLs auflösen. */
export function unwrapDdgUrl(href) {
  try {
    const u = href.startsWith("//") ? `https:${href}` : href;
    const parsed = new URL(u);
    if (parsed.hostname.includes("duckduckgo.com") && parsed.pathname === "/l/") {
      const target = parsed.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    }
    return u;
  } catch {
    return href;
  }
}

function normalizeResults(items, maxResults) {
  return items
    .filter((r) => r.url && r.title)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title.slice(0, 300),
      url: unwrapDdgUrl(r.url).slice(0, 2000),
      snippet: (r.snippet ?? "").slice(0, 600),
    }));
}

function isDdgBotChallenge(html) {
  return /anomaly-modal|bots use DuckDuckGo/i.test(html);
}

/** DuckDuckGo Lite — stabiler, mit Snippets. */
async function searchDuckDuckGoLite(query, maxResults) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`DuckDuckGo Lite antwortete mit ${res.status}.`);

  const html = await res.text();
  if (isDdgBotChallenge(html)) return [];

  const results = [];
  const blockRe =
    /<a[^>]*class=['"]result-link['"][^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td class=['"]result-snippet['"]>([\s\S]*?)<\/td>/gi;

  let m;
  const seen = new Set();
  while ((m = blockRe.exec(html)) !== null && results.length < maxResults + 2) {
    let href = decodeHtml(m[1]);
    if (href.startsWith("//")) href = `https:${href}`;
    const canonical = unwrapDdgUrl(href);
    if (!canonical.startsWith("http") || seen.has(canonical)) continue;
    seen.add(canonical);
    const title = decodeHtml(m[2]);
    if (!title) continue;
    const snippet = decodeHtml(m[3]);
    results.push({ title, url: canonical, snippet });
  }

  return normalizeResults(results, maxResults);
}

/** DuckDuckGo HTML-Suche (Fallback). */
async function searchDuckDuckGoHtml(query, maxResults) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`DuckDuckGo antwortete mit ${res.status}.`);

  const html = await res.text();
  if (isDdgBotChallenge(html)) return [];

  const results = [];
  const linkRe =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let m;
  const seen = new Set();
  while ((m = linkRe.exec(html)) !== null && results.length < maxResults + 2) {
    let href = decodeHtml(m[1]);
    if (href.startsWith("//")) href = `https:${href}`;
    const canonical = unwrapDdgUrl(href);
    if (!canonical.startsWith("http") || seen.has(canonical)) continue;
    seen.add(canonical);
    const title = decodeHtml(m[2]);
    if (!title) continue;

    const after = html.slice(m.index, m.index + 1200);
    const snippetMatch =
      after.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ??
      after.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//i);
    const snippet = snippetMatch ? decodeHtml(snippetMatch[1]) : "";

    results.push({ title, url: canonical, snippet });
  }

  return normalizeResults(results, maxResults);
}

/** DuckDuckGo Instant Answer API (JSON, oft ohne Captcha — weniger Treffer als HTML). */
async function searchDuckDuckGoInstant(query, maxResults) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];

  const json = await res.json();
  const raw = [];

  if (json.AbstractURL && json.Heading) {
    raw.push({
      title: String(json.Heading),
      url: String(json.AbstractURL),
      snippet: String(json.AbstractText || json.Abstract || ""),
    });
  }

  function flattenRelated(topics) {
    for (const t of topics || []) {
      if (Array.isArray(t.Topics)) flattenRelated(t.Topics);
      else if (t.FirstURL && t.Text) {
        raw.push({
          title: decodeHtml(String(t.Text)),
          url: String(t.FirstURL).replace(/^\/\//, "https://"),
          snippet: "",
        });
      }
    }
  }
  flattenRelated(json.RelatedTopics);

  for (const r of json.Results || []) {
    if (r.FirstURL && r.Text) {
      raw.push({
        title: decodeHtml(String(r.Text)),
        url: String(r.FirstURL).replace(/^\/\//, "https://"),
        snippet: "",
      });
    }
  }

  return normalizeResults(raw, maxResults);
}

async function searchDuckDuckGo(query, maxResults) {
  let results = await searchDuckDuckGoLite(query, maxResults);
  if (results.length === 0) {
    results = await searchDuckDuckGoHtml(query, maxResults);
  }
  if (results.length === 0) {
    results = await searchDuckDuckGoInstant(query, maxResults);
  }
  return results;
}

/** SerpAPI (Google) — https://serpapi.com */
async function searchSerpApi(query, maxResults, apiKey) {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: apiKey,
    num: String(Math.min(maxResults, 10)),
    output: "json",
  });
  const gl = process.env.WEB_SEARCH_GOOGLE_GL?.trim();
  const hl = process.env.WEB_SEARCH_GOOGLE_HL?.trim();
  const location = process.env.WEB_SEARCH_GOOGLE_LOCATION?.trim();
  const googleDomain = process.env.WEB_SEARCH_GOOGLE_DOMAIN?.trim();
  if (gl) params.set("gl", gl);
  if (hl) params.set("hl", hl);
  if (location) params.set("location", location);
  if (googleDomain) params.set("google_domain", googleDomain);
  else if (gl === "de" || hl === "de") params.set("google_domain", "google.de");

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof json.error === "string"
        ? json.error
        : json.error?.message || `SerpAPI ${res.status}`;
    throw new Error(String(msg).slice(0, 300));
  }
  const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
  return normalizeResults(
    organic.map((o) => ({
      title: String(o.title ?? ""),
      url: String(o.link ?? ""),
      snippet: String(o.snippet ?? ""),
    })),
    maxResults,
  );
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

function resolveWebSearchProvider(requested, keys) {
  if (requested === "serpapi" && keys.serpapi) return "serpapi";
  if (requested === "serper" && keys.serper) return "serper";
  return "duckduckgo";
}

export function getWebSearchConfig() {
  const requested = (process.env.WEB_SEARCH_PROVIDER || "duckduckgo").toLowerCase();
  const serpapiKey =
    process.env.WEB_SEARCH_SERPAPI_API_KEY?.trim() ||
    process.env.SERPAPI_API_KEY?.trim() ||
    "";
  const serperKey = process.env.WEB_SEARCH_SERPER_API_KEY?.trim() || "";
  const maxResults = Math.min(
    Math.max(Number(process.env.WEB_SEARCH_MAX_RESULTS || DEFAULT_MAX_RESULTS), 1),
    10,
  );
  const effectiveProvider = resolveWebSearchProvider(requested, {
    serpapi: serpapiKey,
    serper: serperKey,
  });
  return {
    enabled: true,
    provider: effectiveProvider,
    requestedProvider: requested,
    providers: {
      duckduckgo: { label: "DuckDuckGo", requiresApiKey: false },
      serpapi: {
        label: "Google (SerpAPI)",
        requiresApiKey: true,
        configured: Boolean(serpapiKey),
      },
      serper: { label: "Google (Serper)", requiresApiKey: true, configured: Boolean(serperKey) },
    },
    maxResults,
  };
}

export async function searchWeb(rawQuery, options = {}) {
  const query = normalizeSearchEngineQuery(String(rawQuery ?? "").trim());
  if (!query) return { query: "", provider: "duckduckgo", results: [] };
  if (query.length > MAX_QUERY_LEN) {
    throw new Error(`Suchanfrage zu lang (max. ${MAX_QUERY_LEN} Zeichen).`);
  }

  const cfg = getWebSearchConfig();
  const requested = cfg.requestedProvider;
  const maxResults = Math.min(options.maxResults ?? cfg.maxResults, 10);

  let results;
  if (cfg.provider === "serpapi") {
    const key =
      process.env.WEB_SEARCH_SERPAPI_API_KEY?.trim() ||
      process.env.SERPAPI_API_KEY?.trim();
    if (!key) {
      throw new Error(
        "SerpAPI ist gewählt, aber WEB_SEARCH_SERPAPI_API_KEY (oder SERPAPI_API_KEY) fehlt.",
      );
    }
    results = await searchSerpApi(query, maxResults, key);
  } else if (cfg.provider === "serper") {
    const key = process.env.WEB_SEARCH_SERPER_API_KEY?.trim();
    if (!key) throw new Error("Serper ist gewählt, aber WEB_SEARCH_SERPER_API_KEY fehlt.");
    results = await searchSerper(query, maxResults, key);
  } else {
    if (requested === "serpapi" || requested === "serper") {
      throw new Error(
        `WEB_SEARCH_PROVIDER=${requested}, aber kein passender API-Key in .env gesetzt.`,
      );
    }
    results = await searchDuckDuckGo(query, maxResults);
  }

  return { query, provider: cfg.provider, results };
}

const MULTI_SEARCH_MAX_TOTAL = 15;
const MULTI_SEARCH_DDG_PAUSE_MS = 700;

/**
 * Mehrere kurze Suchzeilen nacheinander — Treffer nach URL deduplizieren.
 * @param {string[]} rawQueries
 * @param {{ maxResults?: number }} [options]
 */
export async function searchWebMulti(rawQueries, options = {}) {
  const queries = (Array.isArray(rawQueries) ? rawQueries : [])
    .map((q) => String(q ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);
  if (queries.length === 0) {
    return { query: "", provider: "duckduckgo", results: [] };
  }
  if (queries.length === 1) {
    return searchWeb(queries[0], options);
  }

  const cfg = getWebSearchConfig();
  const maxTotal = Math.min(
    Math.max(Number(options.maxResults) || cfg.maxResults * 2, cfg.maxResults),
    MULTI_SEARCH_MAX_TOTAL,
  );
  const perQuery = Math.max(3, Math.ceil(maxTotal / queries.length));
  const combined = [];
  const seen = new Set();
  let provider = cfg.provider;

  for (let i = 0; i < queries.length; i++) {
    const rawQ = queries[i];
    try {
      const data = await searchWeb(rawQ, { maxResults: perQuery });
      provider = data.provider;
      for (const r of data.results) {
        const key = r.url.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(r);
        }
      }
    } catch (e) {
      console.error("Websuche Teilanfrage:", rawQ, e);
    }
    if (
      i < queries.length - 1 &&
      cfg.provider === "duckduckgo" &&
      combined.length < maxTotal
    ) {
      await new Promise((resolve) => setTimeout(resolve, MULTI_SEARCH_DDG_PAUSE_MS));
    }
    if (combined.length >= maxTotal) break;
  }

  return {
    query: queries.join(" · "),
    provider,
    results: combined.slice(0, maxTotal),
  };
}
