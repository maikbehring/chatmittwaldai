import { apiUrl } from "./appPaths";
import {
  ensureOkApiResponse,
  type PlaygroundRateLimits,
} from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { blobToBase64, blobToWav16Chunks } from "./blobToWav";

export type TranscribeProgress = {
  chunk: number;
  total: number;
  phase: "segment" | "prepare" | "chunk";
  chunkDurationSeconds?: number;
  chunkBytes?: number;
};

async function transcribeWavBlob(
  wav: Blob,
  language: string,
  rateLimits: PlaygroundRateLimits | null | undefined,
): Promise<string> {
  const audio = await blobToBase64(wav);
  const res = await fetch(apiUrl("/api/audio/transcriptions"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ audio, language }),
  });
  await ensureOkApiResponse(res, rateLimits);
  const data = (await res.json()) as { text?: string };
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("Keine Sprache erkannt.");
  return text;
}

/**
 * Transkribiert Audio — bei Länge > Whisper-Limit automatisch in Chunks gesplittet.
 */
export async function transcribeAudioBlob(
  raw: Blob,
  options: {
    language: string;
    maxAudioBytes: number;
    rateLimits?: PlaygroundRateLimits | null;
    onProgress?: (progress: TranscribeProgress) => void;
  },
): Promise<string> {
  const wavChunks = await blobToWav16Chunks(raw, {
    maxChunkBytes: Math.floor(options.maxAudioBytes * 0.92),
  });

  options.onProgress?.({
    chunk: 0,
    total: wavChunks.length,
    phase: "prepare",
  });

  const parts: string[] = [];

  for (let i = 0; i < wavChunks.length; i++) {
    const { blob: wav, durationSeconds } = wavChunks[i];
    options.onProgress?.({
      chunk: i + 1,
      total: wavChunks.length,
      phase: "chunk",
      chunkDurationSeconds: durationSeconds,
      chunkBytes: wav.size,
    });
    if (wav.size > options.maxAudioBytes) {
      throw new Error(
        "Audio-Abschnitt überschreitet das Server-Limit. Bitte eine kürzere Datei oder geringere Qualität verwenden.",
      );
    }
    const text = await transcribeWavBlob(wav, options.language, options.rateLimits);
    parts.push(
      wavChunks.length > 1 ? `[Abschnitt ${i + 1}/${wavChunks.length}]\n${text}` : text,
    );
  }

  return parts.join("\n\n");
}
