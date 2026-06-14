import type { PlaygroundRateLimits } from "./apiErrors";
import { MODEL_GLM_OCR } from "./modelPresets";
import type { OcrPageImage } from "./pdfToOcrImages";

export const GLM_OCR_EXTRACT_PROMPT =
  "Extract all text from this document.";

type StreamChatFn = (
  body: Record<string, unknown>,
  onDelta: (t: string) => void,
  signal: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
) => Promise<unknown>;

async function collectStreamChat(
  streamChat: StreamChatFn,
  body: Record<string, unknown>,
  signal: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<string> {
  let text = "";
  await streamChat(
    body,
    (delta) => {
      text += delta;
    },
    signal,
    rateLimits,
  );
  return text.trim();
}

async function ocrSinglePage(
  page: OcrPageImage,
  options: {
    signal: AbortSignal;
    rateLimits?: PlaygroundRateLimits | null;
    streamChat: StreamChatFn;
  },
): Promise<string> {
  const raw = await collectStreamChat(
    options.streamChat,
    {
      model: MODEL_GLM_OCR,
      temperature: 0.1,
      top_p: 1.0,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: page.dataUrl } },
            { type: "text", text: GLM_OCR_EXTRACT_PROMPT },
          ],
        },
      ],
      stream: true,
      stream_options: { include_usage: true },
    },
    options.signal,
    options.rateLimits,
  );
  return raw;
}

/** Stufe 1: GLM-OCR — Rohtext aus gerenderten Seiten (je Seite ein Request, kleinere Payloads). */
export async function extractTextWithGlmOcr(
  pages: OcrPageImage[],
  options: {
    signal: AbortSignal;
    rateLimits?: PlaygroundRateLimits | null;
    onProgress?: (message: string) => void;
    streamChat: StreamChatFn;
  },
): Promise<string> {
  const chunks: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    options.onProgress?.(
      pages.length > 1
        ? `Texterkennung (GLM-OCR) — Seite ${page.pageNumber}/${pages.length} …`
        : "Texterkennung (GLM-OCR) …",
    );

    const raw = await ocrSinglePage(page, options);
    if (!raw) continue;
    chunks.push(
      pages.length > 1
        ? `--- Seite ${page.pageNumber} ---\n${raw}`
        : raw,
    );
  }

  const combined = chunks.join("\n\n").trim();
  if (!combined) {
    throw new Error("GLM-OCR hat keinen Text geliefert.");
  }
  return combined;
}

export function buildInvoiceStructureUserMessage(
  ocrText: string,
  userNotes: string,
  fileName: string,
): string {
  const notes = userNotes.trim();
  let msg =
    "Bitte strukturiere die folgenden OCR-Rohdaten einer Rechnung.\n" +
    `Quelldatei: ${fileName}\n` +
    "Nutze nur Informationen aus dem OCR-Text — nichts erfinden. Fehlende Felder als null.\n";
  if (notes) {
    msg += `\nZusätzlicher Kontext vom Nutzer:\n${notes}\n`;
  }
  msg += `\n--- OCR-Text (GLM-OCR) ---\n${ocrText}\n--- Ende OCR-Text ---`;
  return msg;
}
