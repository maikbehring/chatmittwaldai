import { formatPlaygroundCo2Context } from "./inferenceFootprint";
import { formatPlaygroundTodayContext } from "./playgroundDate";

export type PlaygroundSystemContextMessage = { role: "system"; content: string };

/** Getrennte System-Nachrichten (bessere Gewichtung als ein langer Block). */
export function playgroundSystemContextMessages(): PlaygroundSystemContextMessage[] {
  return [
    { role: "system", content: formatPlaygroundTodayContext() },
    { role: "system", content: formatPlaygroundCo2Context() },
  ];
}

/** Ein Block — z. B. Modellvergleich. */
export function formatPlaygroundBaseSystemContext(): string {
  return `${formatPlaygroundTodayContext()}\n\n${formatPlaygroundCo2Context()}`;
}
