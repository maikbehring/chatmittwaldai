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

  const payload = {
    fetchedAt: new Date().toISOString(),
    sources: [tariffs.url, docs.modelsPage.url],
    tariffs,
    modelsPage: docs.modelsPage,
    apiBaseUrl: docs.apiPage.baseUrl,
  };

  cache = payload;
  cacheAt = now;
  return payload;
}
