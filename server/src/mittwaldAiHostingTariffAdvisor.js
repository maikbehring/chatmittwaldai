import { fetchMittwaldAiHostingDocs } from "./mittwaldAiHostingDocs.js";
import { fetchMittwaldAiHostingTariffs } from "./mittwaldAiHostingTariffs.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = null;
let cacheAt = 0;

/**
 * @param {{ allowedModelIds?: string[] }} [options]
 */
export async function fetchMittwaldAiHostingTariffAdvisor(options = {}) {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) {
    return cache;
  }

  const [tariffs, docs] = await Promise.all([
    fetchMittwaldAiHostingTariffs(),
    fetchMittwaldAiHostingDocs({ allowedModelIds: options.allowedModelIds }),
  ]);

  const warnings = tariffs.parseWarning ? [tariffs.parseWarning] : [];

  const payload = {
    fetchedAt: new Date().toISOString(),
    sources: [
      ...(tariffs.live ? [tariffs.url] : []),
      docs.modelsPage.url,
    ],
    tariffs,
    modelsPage: docs.modelsPage,
    apiBaseUrl: docs.apiPage.baseUrl,
    ...(warnings.length ? { warnings } : {}),
  };

  cache = payload;
  cacheAt = now;
  return payload;
}
