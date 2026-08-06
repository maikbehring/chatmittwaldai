import { formatPlaygroundMittwaldContext } from "./playgroundMittwaldContext";
import { formatPlaygroundAuthorContext } from "./playgroundAuthorContext";
import { formatPlaygroundCo2Context } from "./inferenceFootprint";
import { formatPlaygroundTodayContext } from "./playgroundDate";
import { modelRequiresSingleSystemMessage } from "./modelPresets";

export type PlaygroundSystemContextMessage = { role: "system"; content: string };

export type PlaygroundSystemContextOptions = {
  /** Nur bei expliziten Fragen zur Playground-CO₂-Anzeige — sonst halluziniert das Modell eigene Werte. */
  includeCo2Guide?: boolean;
  /** Nur bei expliziten Fragen zu Maik Behring / Playground-Maintainer — sonst nicht im Chat erwähnen. */
  includeAuthorGuide?: boolean;
  /** Strommix-Forecast-Use-Case: kein mittwald-Produktprofil — weniger Ablenkung bei Forecast-Fragen. */
  skipMittwaldProfile?: boolean;
};

/** Getrennte System-Nachrichten (bessere Gewichtung als ein langer Block). */
export function playgroundSystemContextMessages(
  options?: PlaygroundSystemContextOptions,
): PlaygroundSystemContextMessage[] {
  const msgs: PlaygroundSystemContextMessage[] = [
    { role: "system", content: formatPlaygroundTodayContext() },
  ];
  if (!options?.skipMittwaldProfile) {
    msgs.push({ role: "system", content: formatPlaygroundMittwaldContext() });
  }
  if (options?.includeAuthorGuide) {
    msgs.push({ role: "system", content: formatPlaygroundAuthorContext() });
  }
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
  if (!options?.skipMittwaldProfile) {
    parts.push(formatPlaygroundMittwaldContext());
  }
  if (options?.includeAuthorGuide) {
    parts.push(formatPlaygroundAuthorContext());
  }
  if (options?.includeCo2Guide) {
    parts.push(formatPlaygroundCo2Context());
  }
  return parts.join("\n\n");
}

type SystemMergeableMessage = {
  role: "system" | "user" | "assistant";
  content: string | unknown[];
};

/** Qwen3.5-0.8B: mehrere System-Nachrichten führen upstream zu „Got bad request“ (400). */
export function normalizeApiMessagesForModel<T extends SystemMergeableMessage>(
  messages: T[],
  modelId: string,
): T[] {
  if (!modelRequiresSingleSystemMessage(modelId)) return messages;

  const systemParts: string[] = [];
  const rest: T[] = [];
  for (const m of messages) {
    if (m.role === "system" && typeof m.content === "string" && m.content.trim().length > 0) {
      systemParts.push(m.content);
      continue;
    }
    rest.push(m);
  }

  if (systemParts.length <= 1) return messages;

  return [{ role: "system", content: systemParts.join("\n\n") } as T, ...rest];
}
