/** Bündelt Stream-Deltas auf einen React-Commit pro Animation Frame. */
export function createRafStreamBatcher(onFlush: (text: string) => void) {
  let pending = "";
  let rafId: number | null = null;

  const flushNow = () => {
    if (pending.length === 0) return;
    const chunk = pending;
    pending = "";
    onFlush(chunk);
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      flushNow();
    });
  };

  return {
    push(delta: string) {
      if (!delta) return;
      pending += delta;
      schedule();
    },
    flush() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      flushNow();
    },
    cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pending = "";
    },
  };
}
