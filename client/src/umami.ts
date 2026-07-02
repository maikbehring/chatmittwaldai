import {
  PLAYGROUND_USE_CASES,
  type PlaygroundUseCase,
  type PlaygroundUseCaseId,
} from "./playgroundUseCases";

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
export const UMAMI_EVENT_USE_CASE_SEND = "use-case-send";

/** Alle registrierten Playground-Use-Cases — synchron mit PLAYGROUND_USE_CASES halten. */
export const UMAMI_TRACKED_USE_CASE_IDS: PlaygroundUseCaseId[] = PLAYGROUND_USE_CASES.map(
  (uc) => uc.id,
);

export function umamiUseCaseEventName(
  useCaseId: string,
  kind: "start" | "send",
): string {
  return `use-case-${kind}-${useCaseId}`;
}

type UseCaseUmamiOptions = {
  category?: string;
  experimental?: boolean;
  beta?: boolean;
};

function useCaseUmamiEventData(
  useCaseId: string,
  options?: UseCaseUmamiOptions,
): Record<string, string> {
  return {
    use_case: useCaseId,
    ...(options?.category ? { kategorie: options.category } : {}),
    ...(options?.experimental ? { experimental: "ja" } : {}),
    ...(options?.beta ? { beta: "ja" } : {}),
  };
}

export function useCaseUmamiOptions(uc: PlaygroundUseCase): UseCaseUmamiOptions {
  return {
    category: uc.category,
    experimental: uc.experimental,
    beta: uc.beta,
  };
}

/** Use Case gewählt — Sammel-Event + ein Event pro Use Case (z. B. use-case-start-alt-tags). */
export function trackUseCaseStart(
  useCaseId: string,
  options?: UseCaseUmamiOptions,
): void {
  const data = useCaseUmamiEventData(useCaseId, options);
  trackUmamiEvent(UMAMI_EVENT_USE_CASE_START, data);
  trackUmamiEvent(umamiUseCaseEventName(useCaseId, "start"), data);
}

/** Erste Nachricht / Aktion in einem Use Case — Sammel-Event + ein Event pro Use Case. */
export function trackUseCaseSend(
  useCaseId: string,
  options?: UseCaseUmamiOptions,
): void {
  const data = useCaseUmamiEventData(useCaseId, options);
  trackUmamiEvent(UMAMI_EVENT_USE_CASE_SEND, data);
  trackUmamiEvent(umamiUseCaseEventName(useCaseId, "send"), data);
}

export function trackPlaygroundUseCaseStart(uc: PlaygroundUseCase): void {
  trackUseCaseStart(uc.id, useCaseUmamiOptions(uc));
}

export function trackPlaygroundUseCaseSend(uc: PlaygroundUseCase | null | undefined): void {
  if (!uc) return;
  trackUseCaseSend(uc.id, useCaseUmamiOptions(uc));
}
