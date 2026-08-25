import { useEffect, useMemo } from "react";
import { base64ToBlob, type TtsResultPayload } from "./textToSpeech";

type Props = {
  result: TtsResultPayload;
};

export function TtsAudioPlayer({ result }: Props) {
  const objectUrl = useMemo(() => {
    const blob = base64ToBlob(result.audioBase64, result.mimeType);
    return URL.createObjectURL(blob);
  }, [result.audioBase64, result.mimeType]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div className="mb-3 rounded-xl border border-playground-border bg-playground-sidebar/80 p-3">
      <audio controls preload="metadata" className="w-full" src={objectUrl}>
        Dein Browser unterstützt keine Audio-Wiedergabe.
      </audio>
      <a
        href={objectUrl}
        download={result.fileName}
        className="mt-2 inline-flex playground-text-tiny font-semibold text-playground-link underline decoration-playground-link/25 underline-offset-2 hover:text-playground-link-hover"
      >
        {result.fileName} herunterladen
      </a>
    </div>
  );
}
