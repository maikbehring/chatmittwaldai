/**
 * Kurze Google-taugliche Suchzeile aus Nutzer-Intent + Chat-Auszug (über mittwald chat/completions).
 */

const MAX_EXCERPT_CHARS = 16000;
/** Ziel-Länge für das Modell; finale Kürzung auch in webSearch.js (normalizeSearchEngineQuery). */
const MAX_QUERY_CHARS = 130;

const SYSTEM_PROMPT = `Du erzeugst GENAU EINE kurze Google-Suchzeile — so, wie ein Mensch sie tippt. Kein Kommentar, kein Markdown.

STRENG (Verstöße machen die Suche nutzlos):
- Maximal 8–10 Wörter. Keine langen Listen, keine „Wunschliste“ aus vielen Jobtiteln.
- NUR EINE Schwerpunkt-Rolle oder Stichwortgruppe plus optional Region (z. B. „Product Lead AI Jobs Deutschland“). Wenn mehrere Rollen im Chat vorkommen: die passendste EINE wählen.
- Keine **Sternchen**, keine Hashtags, keine Bullet-Listen, keine mehrfachen „Anführungszeichen“-Blöcke hintereinander.
- Keine Website-Namen (LinkedIn, StepStone, otta, wellfound …) und kein site: — außer der Nutzer verlangt ausdrücklich eine bestimmte Seite.
- Keine Firmennamen-Stacks; höchstens ein klarer Arbeitgeber, wenn die Nutzerfrage danach ist.

Antworte nur mit dieser einen Zeile, sonst nichts.`;

function throwUpstream(text, statusOk) {
  if (statusOk) return;
  let msg = typeof text === "string" ? text.slice(0, 800) : "Upstream-Fehler.";
  try {
    const j = JSON.parse(typeof text === "string" ? text : "{}");
    const inner =
      (typeof j?.error?.message === "string" && j.error.message) ||
      (typeof j?.message === "string" && j.message);
    if (inner) msg = String(inner).slice(0, 800);
  } catch {
    /* use msg */
  }
  throw new Error(msg);
}

function stripMarkdownNoise(s) {
  return String(s)
    .replace(/\*\*?/g, " ")
    .replace(/`+/g, " ")
    .replace(/#{1,6}\s*/g, " ")
    .replace(/[_]+/g, " ");
}

function clipToWordBudget(s, maxWords) {
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function sanitizeSearchLine(raw) {
  let s = String(raw ?? "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const fenceMatch = /^`{1,3}([^`]*)`{1,3}$/;
  const mFence = s.match(fenceMatch);
  if (mFence) s = mFence[1].trim();

  s = stripMarkdownNoise(s)
    .replace(/\s+/g, " ")
    .trim();

  s = s.replace(/^(Suchanfrage|Google[\s-]?Suche|Suche|Query|Suchbegriffe)\s*[:.\-]\s*/i, "");
  s = s.replace(/^[\s"'„«‚]+|[\s"'”»‚]+$/gu, "");

  s = clipToWordBudget(s, 10);
  if (s.length > MAX_QUERY_CHARS) {
    s = s.slice(0, MAX_QUERY_CHARS).trimEnd();
    const cut = s.lastIndexOf(" ");
    if (cut > 40) s = s.slice(0, cut);
  }
  return s;
}

export function pickWebSearchQueryModel(envExplicit, allowedList) {
  const ex = envExplicit?.trim();
  if (ex) {
    if (allowedList.length > 0 && !allowedList.includes(ex)) return allowedList[0] || ex;
    return ex;
  }
  if (allowedList.length > 0) return allowedList[0];
  return "gpt-oss-120b";
}

/**
 * SSE-Fallback wenn stream:false trotzdem als Text-Events kommt (selten).
 */
function distillFromSSEText(body) {
  const lines = body.split("\n").filter((l) => l.startsWith("data:") && !l.includes("[DONE]"));
  let acc = "";
  for (const l of lines) {
    try {
      const payload = JSON.parse(l.slice(l.indexOf("data:") + 5).trim());
      const d = payload?.choices?.[0]?.delta;
      if (typeof d?.content === "string") acc += d.content;
      const t = payload?.choices?.[0]?.text;
      if (typeof t === "string") acc += t;
    } catch {
      /* skip */
    }
  }
  return acc;
}

/**
 * @param {{
 *   apiKey: string;
 *   baseUrl: string;
 *   model: string;
 *   userMessage: string;
 *   chatExcerpt: string;
 * }} opts
 * @returns {Promise<string>}
 */
export async function synthesizeGoogleSearchQuery(opts) {
  const { apiKey, baseUrl, model } = opts;
  const um = String(opts.userMessage ?? "").trim();
  if (!um) throw new Error("userMessage fehlt.");

  const excerpt = String(opts.chatExcerpt ?? "").slice(0, MAX_EXCERPT_CHARS);

  const userBlock = `${excerpt ? `--- Gesprächsauszug (nur Kontext) ---\n${excerpt}\n\n` : ""}--- Aktuelle Websuche-Anweisung des Nutzers ---\n${um}\n\nNur die eine Suchzeile:`;

  const url = `${String(baseUrl).replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userBlock },
      ],
      max_tokens: 48,
      temperature: 0.1,
      stream: false,
    }),
  });

  const text = await res.text();

  throwUpstream(text, res.ok);

  let jsonContent = text;
  if (text.includes("data:") && !text.trim().startsWith("{")) {
    jsonContent = distillFromSSEText(text);
    const qFromSse = sanitizeSearchLine(jsonContent);
    if (qFromSse) return takeFirstAlternative(qFromSse);
    throw new Error("Such-Query-API lieferte leere SSE-Inhalte.");
  }

  /** @type {unknown} */
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Keine gültige JSON-Antwort von der Such-Query-API.");
  }
  const ch0 =
    json && typeof json === "object" && Array.isArray(json.choices) && json.choices[0]
      ? json.choices[0]
      : null;
  const content =
    (ch0 && typeof ch0.message?.content === "string" && ch0.message.content) ||
    (ch0 && typeof ch0.text === "string" && ch0.text) ||
    "";

  let q = sanitizeSearchLine(content);
  if (!q) throw new Error("Modell hat keine gültige Suchzeile geliefert.");
  return takeFirstAlternative(q);
}

function takeFirstAlternative(q) {
  const first = q.split("|")[0];
  return sanitizeSearchLine(first);
}

export { MAX_EXCERPT_CHARS, MAX_QUERY_CHARS };
