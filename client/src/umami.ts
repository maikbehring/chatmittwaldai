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
