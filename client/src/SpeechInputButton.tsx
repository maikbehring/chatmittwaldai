import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { blobToBase64, blobToWav16 } from "./blobToWav";

export type SpeechInputHandle = {
  stopRecording: (options?: { skipTranscribe?: boolean }) => void;
};

type Props = {
  disabled?: boolean;
  language?: string;
  maxAudioBytes?: number;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  onRecordingChange?: (recording: boolean, stream: MediaStream | null) => void;
};

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

export const SpeechInputButton = forwardRef<SpeechInputHandle, Props>(function SpeechInputButton(
  {
    disabled = false,
    language = "de",
    maxAudioBytes = 25 * 1024 * 1024,
    onTranscript,
    onError,
    onBusyChange,
    onRecordingChange,
  },
  ref,
) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const skipTranscribeRef = useRef(false);

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

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      stopStream();
    };
  }, [stopStream]);

  const transcribeBlob = useCallback(
    async (raw: Blob) => {
      setTranscribing(true);
      setBusy(true);
      try {
        const wav = await blobToWav16(raw);
        if (wav.size > maxAudioBytes) {
          throw new Error("Aufnahme ist zu lang. Bitte kürzer sprechen (max. ca. 25 MB).");
        }
        const audio = await blobToBase64(wav);
        const res = await fetch("/api/audio/transcriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio, language }),
        });
        if (!res.ok) {
          let msg = res.statusText;
          try {
            const j = (await res.json()) as { error?: { message?: string } };
            msg = j.error?.message ?? msg;
          } catch {
            msg = (await res.text()).slice(0, 500) || msg;
          }
          throw new Error(msg);
        }
        const data = (await res.json()) as { text?: string };
        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (!text) throw new Error("Keine Sprache erkannt.");
        onTranscript(text);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Transkription fehlgeschlagen.");
      } finally {
        setTranscribing(false);
        setBusy(false);
      }
    },
    [language, maxAudioBytes, onError, onTranscript, setBusy],
  );

  const notifyRecording = useCallback(
    (active: boolean, stream: MediaStream | null) => {
      onRecordingChange?.(active, stream);
    },
    [onRecordingChange],
  );

  const stopRecording = useCallback(
    (options?: { skipTranscribe?: boolean }) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        setRecording(false);
        notifyRecording(false, null);
        return;
      }
      skipTranscribeRef.current = Boolean(options?.skipTranscribe);
      rec.stop();
      setRecording(false);
      notifyRecording(false, null);
    },
    [notifyRecording],
  );

  useImperativeHandle(ref, () => ({ stopRecording }), [stopRecording]);

  const startRecording = useCallback(async () => {
    if (disabled || transcribing || recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      onError("Mikrofon wird von diesem Browser nicht unterstützt.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickRecorderMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stopStream();
        if (skipTranscribeRef.current) {
          skipTranscribeRef.current = false;
          chunksRef.current = [];
          return;
        }
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || mime || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size < 200) {
          onError("Aufnahme zu kurz.");
          return;
        }
        void transcribeBlob(blob);
      };
      rec.onerror = () => {
        stopStream();
        setRecording(false);
        notifyRecording(false, null);
        onError("Aufnahme fehlgeschlagen.");
      };
      rec.start(250);
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
      onError(msg);
    }
  }, [disabled, notifyRecording, onError, recording, stopStream, transcribeBlob, transcribing]);

  const handleClick = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  const busy = transcribing;
  const title = recording
    ? "Aufnahme stoppen"
    : transcribing
      ? "Wird transkribiert…"
      : "Spracheingabe (Whisper)";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      title={title}
      aria-label={title}
      aria-pressed={recording}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 ${
        recording
          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
      }`}
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
