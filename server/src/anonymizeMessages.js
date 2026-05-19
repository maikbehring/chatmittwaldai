/**
 * Anonymisiert Chat-Nachrichten über mittwald (Qwen3.6), bevor sie an EUrouter gehen.
 */

const DEFAULT_ANONYMIZE_MODEL = "Qwen3.6-35B-A3B-FP8";

const SYSTEM_PROMPT = `Du bist ein Datenschutz-Filter vor der Weiterleitung an ein externes LLM (EUrouter).

Aufgabe: Ersetze in den übergebenen Chat-Nachrichten alle personenbezogenen und sensiblen Daten durch neutrale Platzhalter. Behalte Sinn, Sprache und technischen Kontext bei.

Ersetzungsregeln (Beispiele):
- Personennamen → [PERSON_1], [PERSON_2], … (gleiche Person = gleicher Platzhalter)
- E-Mail → [EMAIL]
- Telefon → [PHONE]
- Postadressen → [ADDRESS]
- Geburtsdatum, Ausweis-, Sozialversicherungs-, Kundennummern → [ID]
- IBAN, Konto, Kreditkarte → [FINANCIAL]
- IP-Adressen → [IP]
- URLs mit personenbezogenen Pfaden/Token → [URL]
- Firmen/Organisationen, wenn identifizierend → [ORGANIZATION]
- Gesundheits-, Rechts- oder andere besonders schützenswerte Details → [SENSITIVE]

Nicht anonymisieren: allgemeine Fachbegriffe, öffentliche Produktnamen ohne Personenbezug, reine Code-Snippets ohne Secrets.

Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, kein Kommentar):
{"messages":[{"role":"…","content":"…"}, …]}

Die Ausgabe muss dieselbe Anzahl Nachrichten und dieselben "role"-Werte wie die Eingabe haben. "content" ist immer ein String (Multipart-Bilder wurden bereits zu Text zusammengefasst).`;

/**
 * @param {unknown} content
 * @returns {string}
 */
function messageContentToText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  const parts = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    if (part.type === "text" && typeof part.text === "string") {
      parts.push(part.text);
    } else if (part.type === "image_url") {
      parts.push("[Bild — im Anonymmodus nicht an EUrouter übermittelt]");
    }
  }
  return parts.join("\n\n").trim();
}

/**
 * @param {Array<{ role?: string; content?: unknown }>} messages
 * @returns {Array<{ role: string; content: string }>}
 */
export function messagesForAnonymization(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m === "object" && typeof m.role === "string")
    .map((m) => ({
      role: m.role,
      content: messageContentToText(m.content),
    }));
}

function extractJsonObject(text) {
  let s = String(text ?? "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

/**
 * @param {Array<{ role: string; content: string }>} original
 * @param {unknown} parsed
 * @returns {Array<{ role: string; content: string | unknown }>}
 */
function mergeAnonymizedMessages(original, parsed) {
  const list = parsed?.messages;
  if (!Array.isArray(list) || list.length !== original.length) {
    throw new Error("Anonymisierung: ungültige Nachrichtenstruktur in der Modellantwort.");
  }
  return original.map((orig, i) => {
    const item = list[i];
    if (!item || typeof item !== "object" || item.role !== orig.role) {
      throw new Error(`Anonymisierung: Rolle an Position ${i} stimmt nicht überein.`);
    }
    const content = item.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`Anonymisierung: leerer Inhalt an Position ${i}.`);
    }
    return { role: orig.role, content: content.trim() };
  });
}

/**
 * @param {{
 *   apiKey: string;
 *   baseUrl: string;
 *   model?: string;
 *   messages: Array<{ role?: string; content?: unknown; name?: string; tool_call_id?: string; tool_calls?: unknown }>;
 * }} opts
 * @returns {Promise<typeof opts.messages>}
 */
export async function anonymizeMessagesForEurouter(opts) {
  const { apiKey, baseUrl } = opts;
  const model =
    (process.env.PLAYGROUND_ANONYMIZE_MODEL || DEFAULT_ANONYMIZE_MODEL).trim() ||
    DEFAULT_ANONYMIZE_MODEL;

  const normalized = messagesForAnonymization(opts.messages);
  if (normalized.length === 0) {
    throw new Error("Anonymisierung: keine Nachrichten.");
  }

  const hasImageParts = (opts.messages || []).some(
    (m) => Array.isArray(m?.content) && m.content.some((p) => p?.type === "image_url"),
  );
  if (hasImageParts) {
    throw new Error(
      "Anonymmodus: Bilder können nicht an EUrouter gesendet werden. Bitte ohne Bild senden oder Anonymmodus deaktivieren.",
    );
  }

  const userPayload = JSON.stringify({ messages: normalized }, null, 0);

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
        {
          role: "user",
          content: `Anonymisiere diese Nachrichten:\n\n${userPayload}`,
        },
      ],
      max_tokens: 8192,
      temperature: 0.1,
      stream: false,
      extra_body: { chat_template_kwargs: { enable_thinking: false } },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 800);
    try {
      const j = JSON.parse(text);
      const inner =
        (typeof j?.error?.message === "string" && j.error.message) ||
        (typeof j?.message === "string" && j.message);
      if (inner) msg = String(inner).slice(0, 800);
    } catch {
      /* use msg */
    }
    throw new Error(`Anonymisierung fehlgeschlagen (${res.status}): ${msg}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Anonymisierung: keine gültige API-Antwort.");
  }

  const content =
    (typeof json?.choices?.[0]?.message?.content === "string" &&
      json.choices[0].message.content) ||
    "";

  if (!content.trim()) {
    throw new Error("Anonymisierung: leere Modellantwort.");
  }

  let parsed;
  try {
    parsed = extractJsonObject(content);
  } catch {
    throw new Error("Anonymisierung: Modell lieferte kein gültiges JSON.");
  }

  const anonymized = mergeAnonymizedMessages(normalized, parsed);

  return (opts.messages || []).map((orig, i) => {
    const anon = anonymized[i];
    if (!anon) return orig;
    return {
      ...orig,
      role: anon.role,
      content: anon.content,
    };
  });
}

export function getAnonymizeModelId() {
  return (
    (process.env.PLAYGROUND_ANONYMIZE_MODEL || DEFAULT_ANONYMIZE_MODEL).trim() ||
    DEFAULT_ANONYMIZE_MODEL
  );
}
