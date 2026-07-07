import { extractTravelRouteFromText, isSameTravelRoute } from "./playgroundUseCases";
import type { CopySection } from "./CopyTextButton";
import { extractCopySections } from "./CopyTextButton";

const TRAVEL_HEADINGS = [
  "Kurzempfehlung",
  "Vergleich (Richtwerte)",
  "Für die Reiserichtlinie",
  "Quellen & Stand",
  "Copy & Paste — Policy-Snippet",
] as const;

const POLICY_SNIPPET_HEADING = "## Copy & Paste — Policy-Snippet";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTravelHeadingLine(line: string): string {
  const trimmed = line.trim();
  if (/^Copy\s*&\s*Paste\s*[-–—]\s*Policy-Snippet$/i.test(trimmed)) {
    return POLICY_SNIPPET_HEADING;
  }
  if ((TRAVEL_HEADINGS as readonly string[]).includes(trimmed)) {
    return `## ${trimmed}`;
  }
  if (trimmed.startsWith("##")) return line;
  return line;
}

/** Plain-Text-Überschriften in Markdown-## umwandeln. */
export function ensureTravelMarkdownHeadings(text: string): string {
  return text
    .split("\n")
    .map((line) => normalizeTravelHeadingLine(line))
    .join("\n");
}

function policySectionLinesToBullets(lines: string[]): string[] {
  return lines.map((line) => {
    const t = line.trim();
    if (!t) return "";
    if (t.startsWith("- ") || t.startsWith("|") || t.startsWith("```")) return line;
    const labeled = t.match(/^(Bahn bevorzugen|Ausnahmen|Formulierungsvorschlag)\s*:\s*(.+)$/i);
    if (labeled) {
      const label =
        labeled[1].charAt(0).toUpperCase() + labeled[1].slice(1).toLowerCase();
      return `- **${label}:** ${labeled[2].trim()}`;
    }
    return `- ${t}`;
  });
}

function normalizeSectionBullets(text: string, heading: string): string {
  const pattern = new RegExp(
    `(## ${escapeRegExp(heading)}\\s*\\n)([\\s\\S]*?)(?=\\n## |$)`,
    "i",
  );
  return text.replace(pattern, (_match, header: string, body: string) => {
    const lines = body.split("\n");
    const normalized =
      heading === "Für die Reiserichtlinie"
        ? policySectionLinesToBullets(lines)
        : lines.map((line) => {
            const t = line.trim();
            if (!t) return "";
            if (t.startsWith("- ") || t.startsWith("|") || t.startsWith("```")) return line;
            return `- ${t}`;
          });
    const joined = normalized
      .filter((l, i, arr) => !(l === "" && arr[i + 1] === ""))
      .join("\n");
    return `${header}${joined.trimEnd()}\n\n`;
  });
}

function wrapPolicySnippetInCodeBlock(text: string): string {
  const markerPattern = /## Copy & Paste\s*[-–—]\s*Policy-Snippet/i;
  const match = text.match(markerPattern);
  if (!match || match.index == null) return text;

  const idx = match.index;
  const markerLen = match[0].length;
  const before = `${text.slice(0, idx)}${POLICY_SNIPPET_HEADING}`;
  const after = text.slice(idx + markerLen).replace(/^\s*\n/, "");
  if (after.startsWith("```")) return text;

  const footerIdx = after.search(/\n\n(?:KI-Entwurf|Dieser KI-Entwurf)/i);
  const snippetBody = (footerIdx >= 0 ? after.slice(0, footerIdx) : after).trim();
  const footer = footerIdx >= 0 ? after.slice(footerIdx) : "";

  if (!snippetBody) return text;
  return `${before}\n\n\`\`\`\n${snippetBody}\n\`\`\`${footer}`;
}

const INVENTED_PROCESS_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/\büber\s+das\s+mStudio\s+oder\s+direkt\s+im\s+Kundencenter\b/gi, "über das zentrale Reise-/Buchungstool"],
  [/\büber\s+das\s+mStudio\s+oder\b/gi, "über das zentrale Reise-/Buchungstool oder"],
  [/\bim\s+mStudio\b/gi, "im zentralen Reise-/Buchungstool"],
  [/\büber\s+das\s+mStudio\b/gi, "über das zentrale Reise-/Buchungstool"],
  [/\bvia\s+mStudio\b/gi, "über das zentrale Reise-/Buchungstool"],
  [/\bdirekt\s+im\s+Kundencenter\b/gi, "über das zentrale Reise-/Buchungstool"],
  [/\bim\s+Kundencenter\b/gi, "im zentralen Reise-/Buchungstool"],
  [/\bKundencenter\b/g, "zentrales Reise-/Buchungstool"],
  [/\bmStudio\b/g, "zentrales Reise-/Buchungstool"],
];

function sanitizeTravelInventedProcesses(text: string): string {
  let out = text;
  for (const [pattern, replacement] of INVENTED_PROCESS_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function softenMandatoryPolicyWording(text: string): string {
  return text
    .replace(/\bist\s+ausschließlich\s+die\s+Nutzung\b/gi, "wird die Nutzung")
    .replace(/\bist\s+ausschließlich\b/gi, "wird vorrangig")
    .replace(/\bausschließlich\s+die\s+Nutzung\b/gi, "die Nutzung")
    .replace(/\bausschließlich\b/gi, "vorrangig")
    .replace(/\bist\s+gestattet\b/gi, "wird empfohlen")
    .replace(/\bsind\s+gestattet\b/gi, "werden empfohlen")
    .replace(/\bgestattet\b/gi, "empfohlen")
    .replace(/\bpriorisiert\s+werden\s+sollen\b/gi, "nach Möglichkeit genutzt werden können")
    .replace(/\bist\s+vorgeschrieben\b/gi, "kann vorgesehen werden")
    .replace(/\bwird\s+vorgeschrieben\b/gi, "kann vorgesehen werden")
    .replace(/\bist\s+verpflichtend\b/gi, "ist empfohlen")
    .replace(/\bwird\s+verpflichtend\b/gi, "wird empfohlen");
}

function markdownTableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function convertTabularLinesToMarkdownTable(lines: string[]): string[] | null {
  const rows = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t").map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3);

  if (rows.length < 2) return null;
  const colCount = Math.max(...rows.map((row) => row.length));
  const padRow = (cells: string[]) => {
    const padded = [...cells];
    while (padded.length < colCount) padded.push("");
    return markdownTableRow(padded);
  };

  return [
    padRow(rows[0]),
    markdownTableRow(Array.from({ length: colCount }, () => "---")),
    ...rows.slice(1).map(padRow),
  ];
}

/** Tab-getrennte Vergleichstabellen in Pipe-Markdown umwandeln. */
function ensureTravelComparisonTable(text: string): string {
  const pattern = /(## Vergleich \(Richtwerte\)\s*\n)([\s\S]*?)(?=\n## |$)/i;
  return text.replace(pattern, (match, header: string, body: string) => {
    if (/\|\s*---\s*\|/.test(body)) return match;

    const lines = body.split("\n");
    const tableStart = lines.findIndex((line) => line.includes("\t") && line.trim().length > 0);
    if (tableStart < 0) return match;

    let tableEnd = tableStart;
    while (tableEnd < lines.length) {
      const t = lines[tableEnd].trim();
      if (!t) break;
      if (!t.includes("\t") && tableEnd > tableStart) break;
      if (t.includes("\t")) tableEnd += 1;
      else break;
    }

    const converted = convertTabularLinesToMarkdownTable(lines.slice(tableStart, tableEnd));
    if (!converted) return match;

    const rebuilt = [
      ...lines.slice(0, tableStart),
      ...converted,
      ...lines.slice(tableEnd),
    ].join("\n");
    return `${header}${rebuilt.trimEnd()}\n\n`;
  });
}

/** Nach dem Modell: Bullets, Codeblock, Überschriften. */
export function normalizeTravelTrainVsFlightOutput(text: string): string {
  let out = text.replace(/\u2014/g, "-").replace(/ — /g, " - ");
  out = sanitizeTravelInventedProcesses(out);
  out = softenMandatoryPolicyWording(out);
  out = ensureTravelMarkdownHeadings(out);
  out = ensureTravelComparisonTable(out);
  out = normalizeSectionBullets(out, "Für die Reiserichtlinie");
  out = normalizeSectionBullets(out, "Quellen & Stand");
  out = wrapPolicySnippetInCodeBlock(out);
  return out.trimEnd();
}

/** Kopieren-Buttons: Policy-Snippet aus Codeblock, sonst Standard-Extraktion. */
export function extractTravelCopySections(markdown: string): CopySection[] {
  const policy = markdown.match(/## Copy & Paste[\s\S]*?\n```\n([\s\S]*?)```/);
  if (policy?.[1]?.trim()) {
    return [{ label: "Policy-Snippet", text: policy[1].trim() }];
  }
  return extractCopySections(markdown);
}

/** Keine API/Websuche bei identischem Start und Ziel. */
export function getSameTravelRouteStaticResponse(userText: string): string | null {
  const { origin, destination } = extractTravelRouteFromText(userText);
  if (!isSameTravelRoute(origin, destination)) return null;

  return normalizeTravelTrainVsFlightOutput(
    `## Kurzempfehlung

Für die Strecke ${origin} nach ${destination} (Start und Ziel identisch) ist keine Reise erforderlich. Es fallen keine Fahrtkosten an und es entstehen keine CO₂-Emissionen durch Fortbewegung.

## Vergleich (Richtwerte)

| Kriterium | Bahn | Flug | Anmerkung/Quelle |
| --- | --- | --- | --- |
| Reisezeit Tür-zu-Tür | 0 Min. | 0 Min. | Keine Fahrt notwendig |
| Direkte Verbindung | n. a. | n. a. | Keine Strecke im Fahrplan |
| CO₂ pro Person | 0 kg | 0 kg | Keine Emissionen |
| Kosten | 0 € | 0 € | Keine Ticketkosten |

## Für die Reiserichtlinie

- Bei identischem Start und Zielort wird keine Reisebuchung getätigt.
- Es werden keine Fahrtkosten erstattet und kein CO₂ ausgewiesen.
- Formulierungsvorschlag: „Wenn Start und Ziel identisch sind, ist keine Dienstreise anzumelden. Bitte Start und Ziel prüfen (z. B. ${origin} nach [anderer Ort]).“

## Quellen & Stand

- Keine Websuche erforderlich (Eingabefehler bzw. keine Strecke).

## Copy & Paste — Policy-Snippet

Identischer Start- und Zielort (z. B. ${origin} nach ${destination}):
Keine Reisebuchung, keine Erstattung, keine CO₂-Bilanzierung.
Bei Unklarheit Start und Ziel in der Anfrage korrigieren.

KI-Entwurf: statische Playground-Antwort ohne Websuche, keine verbindliche CO₂-Bilanzierung.`,
  );
}
