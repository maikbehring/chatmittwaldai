import { getBlobDurationSeconds } from "./blobToWav";
import {
  transcribeAudioBlob,
  type TranscribeProgress,
} from "./speechTranscription";
import type { PlaygroundRateLimits } from "./apiErrors";

/** Dateitypen für Whisper (mittwald: mp3, ogg, wav, flac). */
export const AUDIO_FILE_ACCEPT =
  "audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.webm";

export function isAudioUploadFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return /\.(mp3|wav|flac|ogg|m4a|aac|webm)$/i.test(file.name);
}

export function formatAudioDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const totalSec = Math.round(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (m > 0) {
    return `${m}:${String(s).padStart(2, "0")} min`;
  }
  return `${s} s`;
}

export function formatAudioMegabytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type AudioTranscribeProgressState = {
  message: string;
  phase: "prepare" | "transcribe" | "format";
  chunk?: number;
  total?: number;
  chunkDetail?: string;
  fileDurationSeconds?: number | null;
};

export function buildAudioTranscribeProgressMessage(
  progress: TranscribeProgress,
  fileDurationSeconds?: number | null,
): AudioTranscribeProgressState {
  if (progress.phase === "prepare") {
    const fileDur =
      fileDurationSeconds != null && fileDurationSeconds > 0
        ? formatAudioDuration(fileDurationSeconds)
        : null;
    const chunkInfo =
      progress.total > 1
        ? `${progress.total} Abschnitte für Whisper vorbereitet`
        : "1 Abschnitt — kein Split nötig";
    return {
      phase: "prepare",
      message: fileDur
        ? `Audio dekodieren (${fileDur}) …`
        : "Audio dekodieren …",
      total: progress.total,
      chunkDetail: chunkInfo,
      fileDurationSeconds,
    };
  }

  const chunkDur =
    progress.chunkDurationSeconds != null && progress.chunkDurationSeconds > 0
      ? formatAudioDuration(progress.chunkDurationSeconds)
      : null;
  const chunkSize =
    progress.chunkBytes != null ? formatAudioMegabytes(progress.chunkBytes) : null;
  const chunkDetail = [chunkDur, chunkSize].filter(Boolean).join(" · ");

  if (progress.total > 1) {
    return {
      phase: "transcribe",
      message: `Whisper: Abschnitt ${progress.chunk}/${progress.total}`,
      chunk: progress.chunk,
      total: progress.total,
      chunkDetail: chunkDetail || undefined,
      fileDurationSeconds,
    };
  }

  return {
    phase: "transcribe",
    message: "Whisper transkribiert …",
    chunk: 1,
    total: 1,
    chunkDetail: chunkDetail || undefined,
    fileDurationSeconds,
  };
}

export function formatAudioTranscribeProgressDetail(
  state: AudioTranscribeProgressState | null,
  pipelinePhase: "transcribe" | "format" | null,
): string | null {
  if (!state && pipelinePhase !== "format") return null;
  if (pipelinePhase === "format") {
    return "Qwen3.5 strukturiert den Whisper-Rohtext zum Kopieren";
  }
  if (!state) return null;

  if (state.phase === "prepare") {
    return (
      state.chunkDetail ??
      "Sample-Rate und Dateigröße werden für Whisper-Chunks berechnet"
    );
  }

  const parts: string[] = [];
  if (state.chunkDetail) parts.push(state.chunkDetail);
  if (state.fileDurationSeconds != null && state.fileDurationSeconds > 0) {
    parts.push(`Gesamtlänge ${formatAudioDuration(state.fileDurationSeconds)}`);
  }
  if (state.total != null && state.total > 1) {
    parts.push(`Auto-Split: ${state.total} Abschnitte`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function audioTranscribeStatusLine(state: AudioTranscribeProgressState): string {
  return state.chunkDetail ? `${state.message} — ${state.chunkDetail}` : state.message;
}

export function audioAttachmentLabel(file: File, durationSeconds?: number | null): string {
  const dur =
    durationSeconds != null && durationSeconds > 0
      ? ` · ${formatAudioDuration(durationSeconds)}`
      : "";
  return `${file.name}${dur}`;
}

export function buildAudioTranscribeStructureUserMessage(
  transcript: string,
  userNotes: string,
  fileLabel: string,
): string {
  return (
    `Bitte bereinige und formatiere das folgende Whisper-Transkript einer Audiodatei.\n` +
    `Datei: ${fileLabel}\n` +
    `Mehrere [Abschnitt N]-Blöcke chronologisch zusammenführen — Inhalt nicht kürzen oder erfinden.\n\n` +
    (userNotes.trim()
      ? `--- Hinweise ---\n${userNotes.trim()}\n\n`
      : "") +
    `--- Rohtranskript ---\n${transcript.trim()}\n--- Ende Rohtranskript ---`
  );
}

export async function transcribeUploadedAudioFile(
  file: File,
  options: {
    language: string;
    maxAudioBytes: number;
    rateLimits?: PlaygroundRateLimits | null;
    signal?: AbortSignal;
    onProgress?: (state: AudioTranscribeProgressState) => void;
  },
): Promise<{ transcript: string; durationSeconds: number | null }> {
  if (!isAudioUploadFile(file)) {
    throw new Error("Bitte eine Audiodatei (MP3, WAV, FLAC, OGG, …) anhängen.");
  }

  let durationSeconds: number | null = null;
  try {
    durationSeconds = await getBlobDurationSeconds(file);
  } catch {
    durationSeconds = null;
  }

  options.onProgress?.({
    phase: "prepare",
    message: durationSeconds
      ? `Audio dekodieren (${formatAudioDuration(durationSeconds)}) …`
      : "Audio dekodieren …",
    fileDurationSeconds: durationSeconds,
  });

  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const transcript = await transcribeAudioBlob(file, {
    language: options.language,
    maxAudioBytes: options.maxAudioBytes,
    rateLimits: options.rateLimits,
    onProgress: (p) => {
      options.onProgress?.(buildAudioTranscribeProgressMessage(p, durationSeconds));
    },
  });

  return { transcript, durationSeconds };
}
