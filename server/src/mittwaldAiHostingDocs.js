/**
 * Live-Daten aus dem mittwald Developer Portal (Docusaurus HTML).
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/api-endpoints/supported-endpoints/
 */

const MODELS_DOC_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/";
const API_DOC_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/api-endpoints/supported-endpoints/";

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = null;
let cacheAt = 0;

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

function extractMarkdownDiv(html) {
  const start = html.indexOf('<div class="theme-doc-markdown markdown">');
  if (start < 0) return "";
  const end = html.indexOf('<footer class="theme-doc-footer', start);
  return html.slice(start, end > 0 ? end : start + 120_000);
}

async function fetchDocPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "mittwald-ai-playground", Accept: "text/html" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Developer-Doku ${res.status}: ${url}`);
  return res.text();
}

function parseParagraphs(articleHtml) {
  return [...articleHtml.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 10);
}

function parseListItems(articleHtml) {
  return [...articleHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
}

function parseModelsArticle(articleHtml) {
  const intro = parseParagraphs(articleHtml).slice(0, 2);
  const cells = [...articleHtml.matchAll(/<td>([^<]*)<\/td>/g)].map((m) => stripTags(m[1]));
  const models = [];
  for (let i = 0; i + 4 < cells.length; i += 5) {
    models.push({
      name: cells[i],
      type: cells[i + 1],
      modalities: cells[i + 2],
      contextTokens: cells[i + 3],
      license: cells[i + 4],
    });
  }

  const recommendations = parseListItems(articleHtml).filter(
    (t) => /verwende/i.test(t) || /^Für /.test(t),
  );

  const tipMatch = articleHtml.match(
    /<div class="theme-admonition[^"]*tip[^"]*"[\s\S]*?<p>([\s\S]*?)<\/p>/i,
  );
  const tip = tipMatch ? stripTags(tipMatch[1]) : "";

  return {
    url: MODELS_DOC_URL,
    title: "Verfügbare Modelle",
    intro,
    models,
    recommendations,
    tip,
  };
}

function parseSectionContent(articleHtml, headingIndex) {
  const h2Re = /<h2[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/g;
  const headings = [...articleHtml.matchAll(h2Re)].map((m) => ({
    id: m[1],
    title: stripTags(m[2]).replace(/\u200b/g, ""),
    index: m.index,
  }));
  const h = headings[headingIndex];
  if (!h) return null;
  const next = headings[headingIndex + 1];
  const chunk = articleHtml.slice(h.index, next?.index ?? articleHtml.length);

  const subsections = [...chunk.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) =>
    stripTags(m[1]).replace(/\u200b/g, ""),
  );
  const paragraphs = parseParagraphs(chunk).slice(0, 6);

  return {
    id: h.id,
    title: h.title,
    paragraphs,
    subsections,
  };
}

function parseApiArticle(articleHtml) {
  const intro = parseParagraphs(articleHtml).slice(0, 3);
  const h2Count = [...articleHtml.matchAll(/<h2[^>]*id="/g)].length;
  const endpoints = [];
  for (let i = 0; i < h2Count; i++) {
    const section = parseSectionContent(articleHtml, i);
    if (section) endpoints.push(section);
  }
  return {
    url: API_DOC_URL,
    title: "Unterstützte API-Endpunkte",
    intro,
    baseUrl: "https://llm.aihosting.mittwald.de/v1",
    endpoints,
  };
}

/**
 * @param {{ allowedModelIds?: string[] }} [options]
 */
export async function fetchMittwaldAiHostingDocs(options = {}) {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) {
    return applyAllowedModels(cache, options.allowedModelIds);
  }

  const [modelsHtml, apiHtml] = await Promise.all([
    fetchDocPage(MODELS_DOC_URL),
    fetchDocPage(API_DOC_URL),
  ]);

  const modelsArticle = extractMarkdownDiv(modelsHtml);
  const apiArticle = extractMarkdownDiv(apiHtml);
  if (!modelsArticle || !apiArticle) {
    throw new Error("Developer-Doku konnte nicht geparst werden.");
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    modelsPage: parseModelsArticle(modelsArticle),
    apiPage: parseApiArticle(apiArticle),
    sources: [MODELS_DOC_URL, API_DOC_URL],
  };

  cache = payload;
  cacheAt = now;
  return applyAllowedModels(payload, options.allowedModelIds);
}

function applyAllowedModels(data, allowedModelIds) {
  if (!Array.isArray(allowedModelIds) || allowedModelIds.length === 0) {
    return data;
  }
  const allowed = new Set(allowedModelIds.map((id) => id.toLowerCase()));
  const models = data.modelsPage.models.map((m) => ({
    ...m,
    inPlayground: allowed.has(m.name.toLowerCase()),
  }));
  return {
    ...data,
    modelsPage: { ...data.modelsPage, models },
    playgroundAllowedModels: allowedModelIds,
  };
}
