import type { LearningProfile } from "../learning-profile";
export function voiceTiming(level: LearningProfile["level"]) {
  return {
    new: { thinkingSeconds: 8, silenceMs: 1500 },
    hangul: { thinkingSeconds: 6, silenceMs: 1300 },
    basic: { thinkingSeconds: 4, silenceMs: 1100 },
    intermediate: { thinkingSeconds: 2, silenceMs: 1000 },
    advanced: { thinkingSeconds: 1, silenceMs: 900 },
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
