import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY_V2,
  STORAGE_KEY_V3,
} from "./chatStorage";

export const PLAYGROUND_THEME_STORAGE_KEY = "mittwald-ai-playground-theme";
export const PLAYGROUND_WEB_SEARCH_CONSENT_KEY =
  "mittwald-ai-playground-web-search-consent-v1";
const PLAYGROUND_BONUS_GRANT_KEY = "mittwald-ai-playground-bonus-grant-v1";

const PLAYGROUND_LOCAL_STORAGE_KEYS = [
  STORAGE_KEY_V3,
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY,
  PLAYGROUND_THEME_STORAGE_KEY,
  PLAYGROUND_WEB_SEARCH_CONSENT_KEY,
] as const;

/** Bonus „Weiter testen“ pro Rate-Limit-Fenster nur einmal (sessionStorage). */
export function markBonusChatGrantUsed(windowMs: number): void {
  try {
    sessionStorage.setItem(
      PLAYGROUND_BONUS_GRANT_KEY,
      JSON.stringify({ at: Date.now(), windowMs }),
    );
  } catch {
    /* private mode / quota */
  }
}

export function isBonusChatGrantUsed(windowMs: number): boolean {
  try {
    const raw = sessionStorage.getItem(PLAYGROUND_BONUS_GRANT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at?: number; windowMs?: number };
    if (typeof parsed.at !== "number" || parsed.windowMs !== windowMs) return false;
    return Math.floor(parsed.at / windowMs) === Math.floor(Date.now() / windowMs);
  } catch {
    return false;
  }
}

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
