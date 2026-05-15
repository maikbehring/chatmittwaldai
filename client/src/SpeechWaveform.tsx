import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 52;

type Props = {
  stream: MediaStream | null;
  className?: string;
};

/** Wellenform über die volle Eingabebreite (Pegel-Balken gleichmäßig verteilt). */
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
      className={`flex min-h-[44px] w-full min-w-0 flex-1 items-center gap-[2px] px-2 ${className}`}
      role="img"
      aria-label="Sprache wird aufgenommen"
    >
      {levels.map((level, i) => (
        <span
          key={i}
          className={`voice-wave-bar mx-auto min-w-[2px] max-w-[4px] flex-1 rounded-full bg-neutral-700 dark:bg-neutral-300 ${stream ? "" : "voice-wave-bar-idle"}`}
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
