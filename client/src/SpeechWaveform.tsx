import { useEffect, useRef, useState } from "react";

const BAR_COUNT_DEFAULT = 52;
const BAR_COUNT_COMPACT = 28;

type Props = {
  stream: MediaStream | null;
  /** Weniger Balken — z. B. schmale Composer-Leiste auf Mobile. */
  compact?: boolean;
  className?: string;
};

/** Wellenform über die volle Eingabebreite (Pegel-Balken gleichmäßig verteilt). */
export function SpeechWaveform({ stream, compact = false, className = "" }: Props) {
  const barCount = compact ? BAR_COUNT_COMPACT : BAR_COUNT_DEFAULT;
  const [levels, setLevels] = useState<number[]>(() =>
    Array(barCount).fill(0.15),
  );
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setLevels(Array(barCount).fill(0.15));
    if (!stream) {
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
      const step = Math.max(1, Math.floor(bins.length / barCount));

      const tick = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(bins);
        const next: number[] = [];
        for (let i = 0; i < barCount; i++) {
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
  }, [stream, barCount]);

  return (
    <div
      className={`flex min-h-[36px] min-w-0 flex-1 items-center gap-px overflow-hidden px-1 sm:min-h-[44px] sm:gap-[2px] sm:px-2 ${className}`}
      role="img"
      aria-label="Sprache wird aufgenommen"
    >
      {levels.map((level, i) => (
        <span
          key={i}
          className={`voice-wave-bar mx-auto min-w-0 max-w-[3px] flex-1 rounded-full bg-neutral-700 dark:bg-neutral-300 sm:max-w-[4px] ${stream ? "" : "voice-wave-bar-idle"}`}
          style={{
            height: `${Math.round(6 + level * 22)}px`,
            opacity: 0.4 + level * 0.6,
            animationDelay: stream ? undefined : `${(i % 8) * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}
