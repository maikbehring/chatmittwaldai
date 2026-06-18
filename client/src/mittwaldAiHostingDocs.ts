import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { formatPlaygroundTodayContext } from "./playgroundDate";

export type AiHostingModelRow = {
  name: string;
  type: string;
  modalities: string;
  contextTokens: string;
  license: string;
  inPlayground?: boolean;
};

export type AiHostingApiSection = {
  id: string;
  title: string;
  paragraphs: string[];
  subsections: string[];
};

export type MittwaldAiHostingDocsResponse = {
  fetchedAt: string;
  sources: string[];
  playgroundAllowedModels?: string[];
  modelsPage: {
    url: string;
    title: string;
    intro: string[];
    models: AiHostingModelRow[];
    recommendations: string[];
    tip: string;
  };
  apiPage: {
    url: string;
    title: string;
    intro: string[];
    baseUrl: string;
    endpoints: AiHostingApiSection[];
  };
};

export async function fetchMittwaldAiHostingDocs(
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<MittwaldAiHostingDocsResponse> {
  const res = await fetch(apiUrl("/api/mittwald/ai-hosting-docs"), {
    headers: playgroundApiHeaders(),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as MittwaldAiHostingDocsResponse;
}

function formatIssueDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatMittwaldAiHostingDocsContext(
  data: MittwaldAiHostingDocsResponse,
): string {
  const modelLines = data.modelsPage.models.map(
    (m, i) =>
      `[M${i + 1}] ${m.name}\n` +
      `Typ: ${m.type} · Modalitäten: ${m.modalities}\n` +
      `Context: ${m.contextTokens} Tokens · Lizenz: ${m.license}` +
      (typeof m.inPlayground === "boolean"
        ? `\nIn diesem Playground freigegeben: ${m.inPlayground ? "ja" : "nein"}`
        : ""),
  );

  const recLines = data.modelsPage.recommendations.map((r, i) => `[R${i + 1}] ${r}`);

  const endpointLines = data.apiPage.endpoints.map(
    (ep, i) =>
      `[E${i + 1}] ${ep.title}\n` +
      (ep.subsections.length ? `Unterthemen: ${ep.subsections.join(", ")}\n` : "") +
      ep.paragraphs.slice(0, 2).join(" "),
  );

  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground — mittwald AI Hosting (live aus Developer-Doku, Stand: ${formatIssueDate(data.fetchedAt)})]\n` +
    `Quellen:\n` +
    `- ${data.modelsPage.url}\n` +
    `- ${data.apiPage.url}\n\n` +
    `WICHTIG: Nutze nur diese Daten — keine erfundenen Modelle oder Endpunkte. ` +
    `Base-URL laut Doku: ${data.apiPage.baseUrl}\n\n` +
    `## Modelle (${data.modelsPage.title})\n` +
    (data.modelsPage.intro.length ? `${data.modelsPage.intro.join(" ")}\n\n` : "") +
    modelLines.join("\n\n") +
    `\n\n## Modell-Empfehlungen (Doku)\n` +
    recLines.join("\n") +
    (data.modelsPage.tip ? `\n\nTipp (Doku): ${data.modelsPage.tip}` : "") +
    `\n\n## API-Endpunkte (${data.apiPage.title})\n` +
    (data.apiPage.intro.length ? `${data.apiPage.intro.join(" ")}\n\n` : "") +
    endpointLines.join("\n\n")
  );
}
