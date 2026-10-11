let audioContext: AudioContext | null = null;

export function playCorrectAnswerSound() {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    const now = audioContext.currentTime;
    for (const [offset, frequency] of [[0, 659.25], [0.105, 783.99]] as const) {
      const tone = audioContext.createOscillator();
      const volume = audioContext.createGain();
      tone.type = "sine";
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, now + offset);
      volume.gain.exponentialRampToValueAtTime(0.075, now + offset + 0.015);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.24);
      tone.connect(volume);
      volume.connect(audioContext.destination);
      tone.start(now + offset);
      tone.stop(now + offset + 0.25);
    }
  } catch {
    // Audio feedback is optional when the browser blocks Web Audio.
  }
}
