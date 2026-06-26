type UmamiTracker = {
  track: (eventName: string, eventData?: Record<string, string>) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/** Custom Event — no-op wenn Umami nicht geladen (z. B. ohne VITE_UMAMI_WEBSITE_ID). */
export function trackUmamiEvent(
  eventName: string,
  eventData?: Record<string, string>,
): void {
  try {
    window.umami?.track(eventName, eventData);
  } catch {
    // Analytics darf die UI nie blockieren
  }
}

export const UMAMI_EVENT_AI_HOSTING_BOOK = "ai-hosting-buchen";
export const UMAMI_EVENT_CONSULT_CALL = "beratung-anrufen";
export const UMAMI_EVENT_USE_CASE_START = "use-case-start";

/** Use Case gewählt — Event-Name bleibt gleich, Filter in Umami über Property `use_case`. */
export function trackUseCaseStart(
  useCaseId: string,
  options?: { category?: string; experimental?: boolean },
): void {
  trackUmamiEvent(UMAMI_EVENT_USE_CASE_START, {
    use_case: useCaseId,
    ...(options?.category ? { kategorie: options.category } : {}),
    ...(options?.experimental ? { experimental: "ja" } : {}),
  });
}
