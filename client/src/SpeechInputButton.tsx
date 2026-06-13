import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  appErrorFromUnknown,
  plainAppError,
  type AppUiError,
  type PlaygroundRateLimits,
} from "./apiErrors";
import { WHISPER_CHUNK_MAX_SECONDS } from "./blobToWav";
import { transcribeAudioBlob, type TranscribeProgress } from "./speechTranscription";

export type SpeechInputHandle = {
  stopRecording: (options?: { skipTranscribe?: boolean }) => void;
  startRecording: () => void;
};

type Props = {
  disabled?: boolean;
  language?: string;
  maxAudioBytes?: number;
  className?: string;
  onTranscript: (text: string) => void;
  /** Wird bei Langaufnahme nach jedem transkribierten Abschnitt aufgerufen. */
  onTranscriptSegment?: (segment: string, fullText: string) => void;
  onError: (error: AppUiError) => void;
  rateLimits?: PlaygroundRateLimits | null;
  onBusyChange?: (busy: boolean) => void;
  onRecordingChange?: (recording: boolean, stream: MediaStream | null) => void;
  /** Besprechungen >20 min: automatische Segment-Rotation + Chunk-Transkription. */
  longRecording?: boolean;
  onTranscribeProgress?: (progress: TranscribeProgress | null) => void;
};

const SEGMENT_ROTATE_MS = WHISPER_CHUNK_MAX_SECONDS * 1000;

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function pickRecorderMime(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const SpeechInputButton = forwardRef<SpeechInputHandle, Props>(function SpeechInputButton(
  {
    disabled = false,
    language = "de",
    maxAudioBytes = 25 * 1024 * 1024,
    className,
    onTranscript,
    onTranscriptSegment,
    onError,
    rateLimits = null,
    onBusyChange,
    onRecordingChange,
    longRecording = false,
    onTranscribeProgress,
  },
  ref,
) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const skipTranscribeRef = useRef(false);
  const rotatingRef = useRef(false);
  const stillRecordingRef = useRef(false);
  const segmentStartedRef = useRef(0);
  const rotateTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const mimeRef = useRef<string | undefined>(undefined);
  const segmentTextsRef = useRef<string[]>([]);
  const transcribeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const segmentIndexRef = useRef(0);

  const setBusy = useCallback(
    (busy: boolean) => {
      onBusyChange?.(busy);
    },
    [onBusyChange],
  );

  const stopStream = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    if (rotateTimerRef.current != null) {
      window.clearInterval(rotateTimerRef.current);
      rotateTimerRef.current = null;
    }
    if (elapsedTimerRef.current != null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      clearTimers();
      stopStream();
    };
  }, [clearTimers, stopStream]);

  const transcribeOptions = useCallback(
    () => ({
      language,
      maxAudioBytes,
      rateLimits,
      onProgress: onTranscribeProgress,
    }),
    [language, maxAudioBytes, onTranscribeProgress, rateLimits],
  );

  const enqueueSegmentTranscription = useCallback(
    (blob: Blob, segmentNo: number) => {
      transcribeQueueRef.current = transcribeQueueRef.current
        .then(async () => {
          onTranscribeProgress?.({ chunk: segmentNo, total: segmentNo, phase: "segment" });
          const text = await transcribeAudioBlob(blob, transcribeOptions());
          segmentTextsRef.current.push(text);
          const full = segmentTextsRef.current.join("\n\n");
          onTranscriptSegment?.(text, full);
        })
        .catch((e) => {
          onError(appErrorFromUnknown(e, rateLimits));
        });
    },
    [onError, onTranscriptSegment, onTranscribeProgress, rateLimits, transcribeOptions],
  );

  const transcribeBlob = useCallback(
    async (raw: Blob) => {
      setTranscribing(true);
      setBusy(true);
      onTranscribeProgress?.({ chunk: 1, total: 1, phase: "chunk" });
      try {
        const text = await transcribeAudioBlob(raw, transcribeOptions());
        onTranscript(text);
      } catch (e) {
        onError(appErrorFromUnknown(e, rateLimits));
      } finally {
        setTranscribing(false);
        setBusy(false);
        onTranscribeProgress?.(null);
      }
    },
    [onError, onTranscript, onTranscribeProgress, rateLimits, setBusy, transcribeOptions],
  );

  const notifyRecording = useCallback(
    (active: boolean, stream: MediaStream | null) => {
      onRecordingChange?.(active, stream);
    },
    [onRecordingChange],
  );

  const startSegmentRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = mimeRef.current;
    chunksRef.current = [];
    segmentStartedRef.current = Date.now();
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      if (skipTranscribeRef.current) {
        skipTranscribeRef.current = false;
        chunksRef.current = [];
        return;
      }
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || mime || "audio/webm",
      });
      chunksRef.current = [];

      if (blob.size < 200) return;

      if (longRecording && rotatingRef.current) {
        rotatingRef.current = false;
        segmentIndexRef.current += 1;
        enqueueSegmentTranscription(blob, segmentIndexRef.current);
        if (stillRecordingRef.current) startSegmentRecorder();
        return;
      }

      if (longRecording) {
        setTranscribing(true);
        setBusy(true);
        segmentIndexRef.current += 1;
        enqueueSegmentTranscription(blob, segmentIndexRef.current);
        void transcribeQueueRef.current
          .then(() => {
            const full = segmentTextsRef.current.join("\n\n");
            if (full.trim()) onTranscript(full);
          })
          .finally(() => {
            setTranscribing(false);
            setBusy(false);
            onTranscribeProgress?.(null);
            segmentTextsRef.current = [];
          });
        return;
      }

      void transcribeBlob(blob);
    };
    rec.onerror = () => {
      stillRecordingRef.current = false;
      clearTimers();
      stopStream();
      setRecording(false);
      setElapsedMs(0);
      notifyRecording(false, null);
      onError(plainAppError("Aufnahme fehlgeschlagen."));
    };
    rec.start(1000);
  }, [
    clearTimers,
    enqueueSegmentTranscription,
    longRecording,
    notifyRecording,
    onError,
    onTranscript,
    onTranscribeProgress,
    setBusy,
    stopStream,
    transcribeBlob,
  ]);

  const stopRecording = useCallback(
    (options?: { skipTranscribe?: boolean }) => {
      const rec = recorderRef.current;
      stillRecordingRef.current = false;
      clearTimers();
      setElapsedMs(0);
      if (!rec || rec.state === "inactive") {
        setRecording(false);
        notifyRecording(false, null);
        return;
      }
      skipTranscribeRef.current = Boolean(options?.skipTranscribe);
      rec.stop();
      setRecording(false);
      notifyRecording(false, null);
      if (options?.skipTranscribe) stopStream();
    },
    [clearTimers, notifyRecording, stopStream],
  );

  const startRecording = useCallback(async () => {
    if (disabled || transcribing || recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      onError(plainAppError("Mikrofon wird von diesem Browser nicht unterstützt."));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      segmentTextsRef.current = [];
      segmentIndexRef.current = 0;
      transcribeQueueRef.current = Promise.resolve();
      const mime = pickRecorderMime();
      mimeRef.current = mime;
      stillRecordingRef.current = true;
      startSegmentRecorder();

      const recordingStarted = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - recordingStarted);
      }, 1000);

      if (longRecording) {
        rotateTimerRef.current = window.setInterval(() => {
          const rec = recorderRef.current;
          if (!rec || rec.state !== "recording" || !stillRecordingRef.current) return;
          if (Date.now() - segmentStartedRef.current >= SEGMENT_ROTATE_MS) {
            rotatingRef.current = true;
            rec.stop();
          }
        }, 5000);
      }

      setRecording(true);
      notifyRecording(true, stream);
    } catch (e) {
      stopStream();
      notifyRecording(false, null);
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben."
          : e instanceof Error
            ? e.message
            : "Mikrofon konnte nicht gestartet werden.";
      onError(plainAppError(msg));
    }
  }, [
    disabled,
    longRecording,
    notifyRecording,
    onError,
    recording,
    startSegmentRecorder,
    stopStream,
    transcribing,
  ]);

  useImperativeHandle(ref, () => ({ stopRecording, startRecording }), [
    stopRecording,
    startRecording,
  ]);

  const handleClick = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  const busy = transcribing;
  const title = recording
    ? longRecording
      ? `Aufnahme stoppen (${formatElapsed(elapsedMs)})`
      : "Aufnahme stoppen"
    : transcribing
      ? "Wird transkribiert…"
      : longRecording
        ? "Besprechung aufnehmen (Whisper, Auto-Chunks)"
        : "Spracheingabe (Whisper)";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      title={title}
      aria-label={title}
      aria-pressed={recording}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 ${className ?? ""}`}
    >
      {transcribing ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700 dark:border-neutral-600 dark:border-t-neutral-200" />
      ) : recording ? (
        <StopIcon />
      ) : (
        <MicIcon />
      )}
    </button>
  );
});
