import { formatPlaygroundCo2Context } from "./inferenceFootprint";
import { formatPlaygroundTodayContext } from "./playgroundDate";

export type PlaygroundSystemContextMessage = { role: "system"; content: string };

export type PlaygroundSystemContextOptions = {
  /** Nur bei expliziten Fragen zur Playground-CO₂-Anzeige — sonst halluziniert das Modell eigene Werte. */
  includeCo2Guide?: boolean;
};

/** Getrennte System-Nachrichten (bessere Gewichtung als ein langer Block). */
export function playgroundSystemContextMessages(
  options?: PlaygroundSystemContextOptions,
): PlaygroundSystemContextMessage[] {
  const msgs: PlaygroundSystemContextMessage[] = [
    { role: "system", content: formatPlaygroundTodayContext() },
  ];
  if (options?.includeCo2Guide) {
    msgs.push({ role: "system", content: formatPlaygroundCo2Context() });
  }
  return msgs;
}

/** Ein Block — z. B. Modellvergleich. */
export function formatPlaygroundBaseSystemContext(
  options?: PlaygroundSystemContextOptions,
): string {
  const parts = [formatPlaygroundTodayContext()];
  if (options?.includeCo2Guide) {
    parts.push(formatPlaygroundCo2Context());
  }
  return parts.join("\n\n");
}
