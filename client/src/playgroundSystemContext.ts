import { formatPlaygroundCo2Context } from "./inferenceFootprint";
import { formatPlaygroundTodayContext } from "./playgroundDate";

/** System-Kontext für jeden Chat-Request (Datum + Playground-Hinweise). */
export function formatPlaygroundBaseSystemContext(): string {
  return `${formatPlaygroundTodayContext()}\n\n${formatPlaygroundCo2Context()}`;
}
