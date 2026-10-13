import type { LearningProfile } from "../learning-profile";
export function voiceTiming(level: LearningProfile["level"]) {
  return {
    new: { thinkingSeconds: 20, silenceMs: 2400 },
    hangul: { thinkingSeconds: 15, silenceMs: 2200 },
    basic: { thinkingSeconds: 10, silenceMs: 1800 },
    intermediate: { thinkingSeconds: 6, silenceMs: 1600 },
    advanced: { thinkingSeconds: 4, silenceMs: 1400 },
  }[level];
}
export function thinkingPause(
  seconds: number,
  signal: AbortSignal,
  onTick: (seconds: number) => void,
  onReady: (skip: (() => void) | null) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Stopped", "AbortError"));
      return;
    }
    let remaining = seconds,
      settled = false;
    const cleanup = () => {
      window.clearInterval(timer);
      signal.removeEventListener("abort", abort);
      onReady(null);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const abort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException("Stopped", "AbortError"));
    };
    const timer = window.setInterval(() => {
      remaining--;
      onTick(Math.max(remaining, 0));
      if (remaining <= 0) finish();
    }, 1000);
    signal.addEventListener("abort", abort, { once: true });
    onReady(finish);
    onTick(remaining);
  });
}
