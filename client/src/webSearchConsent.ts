const CONSENT_KEY = "mittwald-ai-playground-web-search-consent-v1";

export function hasWebSearchConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWebSearchConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function clearWebSearchConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* private mode */
  }
}
