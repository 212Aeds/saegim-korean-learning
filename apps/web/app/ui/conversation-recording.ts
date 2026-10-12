import {
  encodeWav,
  releaseCapture,
  maxClipSeconds,
  type OpenRouterCapture,
} from "./openrouter-audio-capture";
import { silenceDecision } from "./speech-check";
export async function recordConversationTurn(
  signal: AbortSignal,
  onLevel: (level: number) => void,
): Promise<ArrayBuffer> {
  if (signal.aborted) throw new DOMException("Stopped", "AbortError");
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "Microphone access needs a supported browser and a secure connection.",
    );
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
  if (signal.aborted) {
    stream.getTracks().forEach((track) => track.stop());
    throw new DOMException("Stopped", "AbortError");
  }
  let capture: OpenRouterCapture | undefined;
  let released = false;
  try {
    const context = new AudioContext({ sampleRate: 16000 });
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const mute = context.createGain();
    mute.gain.value = 0;
    capture = {
      stream,
      context,
      source,
      processor,
      mute,
      chunks: [],
      samples: 0,
    };
    const clip = capture;
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      let settled = false;
      const started = performance.now();
      let lastSpeech = 0,
        noiseFloor = 0.001;
      const finish = (aborted = false) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        try {
          if (aborted) throw new DOMException("Stopped", "AbortError");
          if (!clip.speechDetected)
            throw new Error(
              "No speech detected. The conversation is paused; start again when you’re ready.",
            );
          resolve(encodeWav(clip));
        } catch (error) {
          reject(error);
        } finally {
          releaseCapture(clip);
          released = true;
          onLevel(0);
        }
      };
      const abort = () => finish(true);
      signal.addEventListener("abort", abort, { once: true });
      processor.onaudioprocess = (event) => {
        if (settled) return;
        const samples = event.inputBuffer.getChannelData(0);
        let energy = 0;
        for (const sample of samples) energy += sample * sample;
        const rms = Math.sqrt(energy / samples.length);
        const elapsed = performance.now() - started;
        if (!clip.speechDetected && elapsed < 400)
          noiseFloor = Math.min(0.006, noiseFloor * 0.9 + rms * 0.1);
        if (rms > Math.max(0.003, noiseFloor * 2.5)) {
          clip.speechDetected = true;
          lastSpeech = elapsed;
        }
        onLevel(Math.min(100, Math.round(rms * 1000)));
        const count = Math.min(
          samples.length,
          context.sampleRate * maxClipSeconds - clip.samples,
        );
        if (count > 0) {
          clip.chunks.push(samples.slice(0, count));
          clip.samples += count;
        }
        if (
          clip.samples >= context.sampleRate * maxClipSeconds ||
          silenceDecision(elapsed, lastSpeech, !!clip.speechDetected) !==
            "continue"
        )
          finish();
      };
      source.connect(processor);
      processor.connect(mute);
      mute.connect(context.destination);
      clip.timer = window.setTimeout(() => finish(), maxClipSeconds * 1000);
      void context.resume().catch((error) => {
        reject(error);
        finish(true);
      });
    });
  } finally {
    if (capture) {
      if (!released) releaseCapture(capture);
    } else stream.getTracks().forEach((track) => track.stop());
  }
}
