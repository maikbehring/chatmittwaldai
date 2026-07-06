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
const TABLE_PLACEHOLDER_PREFIX = "PLAYGROUND_TRAVEL_TABLE_";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalTravelHeading(line: string): (typeof TRAVEL_HEADINGS)[number] | null {
  const trimmed = line.trim().replace(/:\s*$/, "");
  if (/^Copy\s*&\s*Paste\s*[-–—]\s*Policy-Snippet$/i.test(trimmed)) {
    return "Copy & Paste — Policy-Snippet";
  }
  if (/^Für die Reise-?richtlinie$/i.test(trimmed)) {
    return "Für die Reiserichtlinie";
  }
  if (/^Vergleich\s*\(Richtwerte\)$/i.test(trimmed)) {
    return "Vergleich (Richtwerte)";
  }
  for (const heading of TRAVEL_HEADINGS) {
    if (trimmed.toLowerCase() === heading.toLowerCase()) return heading;
  }
  return null;
}

function normalizeTravelHeadingLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith("##")) {
    const inner = trimmed.replace(/^##\s*/, "");
    const canonical = canonicalTravelHeading(inner);
    return canonical ? `## ${canonical}` : line;
  }
  const canonical = canonicalTravelHeading(trimmed);
  if (canonical) return `## ${canonical}`;
  return line;
}

/** Plain-Text-Überschriften in Markdown-## umwandeln. */
export function ensureTravelMarkdownHeadings(text: string): string {
  return text
    .split("\n")
    .map((line) => normalizeTravelHeadingLine(line))
    .join("\n");
}

/** Tabellen vor Bullet-Normalisierung schützen (verhindert „Zugwww.“-Artefakte). */
function shieldMarkdownTables(text: string): { text: string; tables: string[] } {
  const tables: string[] = [];
  const shielded = text.replace(
    /(?:^|\n)((?:\|[^\n]+\n)(?:\|[-:\s|]+\n)(?:\|[^\n]*\n?)+)/g,
    (_match, table: string) => {
      const id = tables.length;
      tables.push(table.trimEnd());
      return `\n${TABLE_PLACEHOLDER_PREFIX}${id}\n`;
    },
  );
  return { text: shielded, tables };
}

function restoreMarkdownTables(text: string, tables: string[]): string {
  return text.replace(
    new RegExp(`${TABLE_PLACEHOLDER_PREFIX}(\\d+)`, "g"),
    (_match, id: string) => `\n${tables[Number(id)] ?? ""}\n`,
  );
}

function shouldSkipBulletLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (t.startsWith("|")) return true;
  if (t.startsWith("- ")) return true;
  if (t.startsWith("```")) return true;
  if (t.startsWith("##")) return true;
  if (t.includes(TABLE_PLACEHOLDER_PREFIX)) return true;
  if (/^Kriterium\s*\|/i.test(t)) return true;
  return false;
}

function policySectionLinesToBullets(lines: string[]): string[] {
  return lines.map((line) => {
    if (shouldSkipBulletLine(line)) return line;
    const t = line.trim();
    const labeled = t.match(/^(Bahn bevorzugen|Ausnahmen|Formulierungsvorschlag)\s*:\s*(.+)$/i);
    if (labeled) {
      const label =
        labeled[1].charAt(0).toUpperCase() + labeled[1].slice(1).toLowerCase();
      return `- **${label}:** ${labeled[2].trim()}`;
    }
    return `- ${t}`;
  });
}

function sourceSectionLinesToBullets(lines: string[]): string[] {
  return lines.map((line) => {
    if (shouldSkipBulletLine(line)) return line;
    const t = line.trim();
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
        : sourceSectionLinesToBullets(lines);
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

/** Nach dem Modell: Bullets, Codeblock, Überschriften. */
export function normalizeTravelTrainVsFlightOutput(text: string): string {
  let out = text.replace(/\u2014/g, "-").replace(/ — /g, " - ");
  out = ensureTravelMarkdownHeadings(out);
  const { text: shielded, tables } = shieldMarkdownTables(out);
  out = normalizeSectionBullets(shielded, "Für die Reiserichtlinie");
  out = normalizeSectionBullets(out, "Quellen & Stand");
  out = restoreMarkdownTables(out, tables);
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
