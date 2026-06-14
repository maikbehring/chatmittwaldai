const SESSION_API_KEY_STORAGE = "mittwald-ai-playground-session-api-key";

export function getSessionApiKey(): string | null {
  try {
    const value = sessionStorage.getItem(SESSION_API_KEY_STORAGE)?.trim();
    if (!value || value.length < 8) return null;
    return value;
  } catch {
    return null;
  }
}

export function setSessionApiKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) {
    clearSessionApiKey();
    return;
  }
  sessionStorage.setItem(SESSION_API_KEY_STORAGE, trimmed);
}

export function clearSessionApiKey(): void {
  try {
    sessionStorage.removeItem(SESSION_API_KEY_STORAGE);
  } catch {
    /* private mode */
  }
}

export function hasSessionApiKey(): boolean {
  return getSessionApiKey() != null;
}

/** Zusätzliche Header für Playground-API-Requests (eigener mittwald-Key). */
export function playgroundApiHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const key = getSessionApiKey();
  if (key) headers["x-mittwald-api-key"] = key;
  return headers;
}
