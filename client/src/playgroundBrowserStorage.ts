import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY_V2,
  STORAGE_KEY_V3,
} from "./chatStorage";

export const PLAYGROUND_THEME_STORAGE_KEY = "mittwald-ai-playground-theme";
export const PLAYGROUND_WEB_SEARCH_CONSENT_KEY =
  "mittwald-ai-playground-web-search-consent-v1";

const PLAYGROUND_LOCAL_STORAGE_KEYS = [
  STORAGE_KEY_V3,
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY,
  PLAYGROUND_THEME_STORAGE_KEY,
  PLAYGROUND_WEB_SEARCH_CONSENT_KEY,
] as const;

/** Alle lokal im Browser gespeicherten Playground-Daten entfernen. */
export function clearPlaygroundBrowserStorage(): void {
  for (const key of PLAYGROUND_LOCAL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* private mode / quota */
    }
  }
}
