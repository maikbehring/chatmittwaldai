import { extractTravelRouteFromText, isSameTravelRoute } from "./playgroundUseCases";

const TRAVEL_HEADINGS = [
  "Kurzempfehlung",
  "Vergleich (Richtwerte)",
  "Für die Reiserichtlinie",
  "Quellen & Stand",
  "Copy & Paste — Policy-Snippet",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Plain-Text-Überschriften in Markdown-## umwandeln. */
export function ensureTravelMarkdownHeadings(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (
        (TRAVEL_HEADINGS as readonly string[]).includes(trimmed) &&
        !trimmed.startsWith("##")
      ) {
        return `## ${trimmed}`;
      }
      return line;
    })
    .join("\n");
}

function normalizeSectionBullets(text: string, heading: string): string {
  const pattern = new RegExp(
    `(## ${escapeRegExp(heading)}\\s*\\n)([\\s\\S]*?)(?=\\n## |$)`,
    "i",
  );
  return text.replace(pattern, (_match, header: string, body: string) => {
    const lines = body.split("\n");
    const normalized = lines.map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (t.startsWith("- ") || t.startsWith("|") || t.startsWith("```")) return line;
      return `- ${t}`;
    });
    const joined = normalized.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
    return `${header}${joined.trimEnd()}\n\n`;
  });
}

function wrapPolicySnippetInCodeBlock(text: string): string {
  const marker = "## Copy & Paste — Policy-Snippet";
  const idx = text.indexOf(marker);
  if (idx < 0) return text;

  const before = text.slice(0, idx + marker.length);
  const after = text.slice(idx + marker.length).replace(/^\s*\n/, "");
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
  out = normalizeSectionBullets(out, "Für die Reiserichtlinie");
  out = normalizeSectionBullets(out, "Quellen & Stand");
  out = wrapPolicySnippetInCodeBlock(out);
  return out.trimEnd();
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
