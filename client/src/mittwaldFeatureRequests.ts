import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { formatPlaygroundTodayContext } from "./playgroundDate";

export type MittwaldFeatureRequestIssue = {
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  url: string;
  labels: string[];
  author: string;
  comments: number;
  bodyPreview: string;
};

export type MittwaldFeatureRequestsResponse = {
  repo: string;
  repoUrl: string;
  fetchedAt: string;
  limit: number;
  issues: MittwaldFeatureRequestIssue[];
};

export async function fetchMittwaldFeatureRequests(
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<MittwaldFeatureRequestsResponse> {
  const res = await fetch(apiUrl("/api/mittwald/feature-requests?limit=10"), {
    headers: playgroundApiHeaders(),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as MittwaldFeatureRequestsResponse;
}

function formatIssueDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatMittwaldFeatureRequestsContext(
  data: MittwaldFeatureRequestsResponse,
): string {
  if (!data.issues.length) {
    return (
      `[Playground — mittwald Feature Requests: keine Issues geladen (${data.repo}).] ` +
      "Sage dem Nutzer, dass der Abruf leer war."
    );
  }

  const lines = data.issues.map((issue, i) => {
    const status = issue.state === "open" ? "offen" : "geschlossen";
    const labels = issue.labels.length ? issue.labels.join(", ") : "—";
    return (
      `[${i + 1}] #${issue.number} — ${issue.title}\n` +
      `Status: ${status} · Erstellt: ${formatIssueDate(issue.createdAt)} · Autor: @${issue.author} · Kommentare: ${issue.comments}\n` +
      `Labels: ${labels}\n` +
      `URL: ${issue.url}\n` +
      `${issue.bodyPreview || "(keine Beschreibungsvorschau)"}`
    );
  });

  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground — mittwald Feature Requests: die ${data.issues.length} zuletzt erstellten Issues aus ${data.repo} ` +
    `(Stand Abruf: ${formatIssueDate(data.fetchedAt)}). Daten von der öffentlichen GitHub-API.]\n` +
    "WICHTIG: Nutze nur diese Issue-Liste — keine erfundenen Feature Requests. " +
    "Links nur aus den URL-Zeilen. Bei bodyPreview nur kurz zusammenfassen, nicht wörtlich alles wiederholen.\n\n" +
    lines.join("\n\n")
  );
}
