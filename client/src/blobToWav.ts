/** Dekodiert beliebige Browser-Aufnahme (z. B. WebM) und liefert 16-bit PCM WAV für Whisper. */
export async function blobToWav16(blob: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  try {
    const arrayBuf = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
    const wavBytes = encodeWav16(audioBuffer);
    return new Blob([wavBytes], { type: "audio/wav" });
  } finally {
    await ctx.close();
  }
}

/** Whisper-Limit ~20 min — Chunks mit Sicherheitsmarge (Sekunden). */
export const WHISPER_CHUNK_MAX_SECONDS = 14 * 60;

function sliceAudioBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  startFrame: number,
  length: number,
): AudioBuffer {
  const sliced = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    sliced.getChannelData(c).set(buffer.getChannelData(c).subarray(startFrame, startFrame + length));
  }
  return sliced;
}

/** Teilt Audio in WAV-Chunks ≤ maxChunkSeconds (für Whisper-Transkription). */
export async function blobToWav16Chunks(
  blob: Blob,
  maxChunkSeconds = WHISPER_CHUNK_MAX_SECONDS,
): Promise<Blob[]> {
  const ctx = new AudioContext();
  try {
    const arrayBuf = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
    const maxFrames = Math.floor(maxChunkSeconds * audioBuffer.sampleRate);
    if (audioBuffer.length <= maxFrames) {
      return [new Blob([encodeWav16(audioBuffer)], { type: "audio/wav" })];
    }
    const chunks: Blob[] = [];
    for (let start = 0; start < audioBuffer.length; start += maxFrames) {
      const length = Math.min(maxFrames, audioBuffer.length - start);
      const sliced = sliceAudioBuffer(ctx, audioBuffer, start, length);
      chunks.push(new Blob([encodeWav16(sliced)], { type: "audio/wav" }));
    }
    return chunks;
  } finally {
    await ctx.close();
  }
}

export function getBlobDurationSeconds(blob: Blob): Promise<number> {
  const ctx = new AudioContext();
  return blob
    .arrayBuffer()
    .then((buf) => ctx.decodeAudioData(buf.slice(0)))
    .then((audioBuffer) => audioBuffer.duration)
    .finally(() => void ctx.close());
}

function encodeWav16(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numFrames = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Base64-Kodierung fehlgeschlagen."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(blob);
  });
}
