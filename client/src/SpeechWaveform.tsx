import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 28;
const DOT_COUNT = 24;

type Props = {
  stream: MediaStream | null;
  className?: string;
};

/** ChatGPT-ähnliche Wellenform: Punkte links, Pegel-Balken rechts. */
export function SpeechWaveform({ stream, className = "" }: Props) {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.15));
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) {
      setLevels(Array(BAR_COUNT).fill(0.15));
      return;
    }

    let cancelled = false;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const setup = async () => {
      if (ctx.state === "suspended") await ctx.resume();
      if (cancelled) return;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);

      const bins = new Uint8Array(analyser.frequencyBinCount);
      const step = Math.max(1, Math.floor(bins.length / BAR_COUNT));

      const tick = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(bins);
        const next: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.min(i * step, bins.length - 1);
          const norm = bins[idx] / 255;
          next.push(0.12 + norm * 0.88);
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    };

    void setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      void ctx.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, [stream]);

  return (
    <div
      className={`flex min-h-[44px] flex-1 items-center gap-3 overflow-hidden px-1 ${className}`}
      role="img"
      aria-label="Sprache wird aufgenommen"
    >
      <div className="flex shrink-0 items-center gap-[5px]" aria-hidden>
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <span
            key={`dot-${i}`}
            className="h-1 w-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-[3px]">
        {levels.map((level, i) => (
          <span
            key={i}
            className={`voice-wave-bar w-[3px] shrink-0 rounded-full bg-neutral-700 dark:bg-neutral-300 ${stream ? "" : "voice-wave-bar-idle"}`}
            style={{
              height: `${Math.round(6 + level * 22)}px`,
              opacity: 0.4 + level * 0.6,
              animationDelay: stream ? undefined : `${(i % 8) * 0.07}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
