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
  options: {
    silenceMs?: number;
    maxSeconds?: number;
    onReady?: (finish: (() => void) | null) => void;
  } = {},
): Promise<ArrayBuffer> {
  const clipSeconds=Math.min(maxClipSeconds,Math.max(1,options.maxSeconds ?? maxClipSeconds));
  if (signal.aborted) throw new DOMException("Stopped", "AbortError");
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "Microphone access needs a supported browser and a secure connection.",
    );
  const stream = await new Promise<MediaStream>((resolve,reject) => {
    let settled = false;
    const finish = (error?: Error, stream?: MediaStream) => {
      if (settled) { stream?.getTracks().forEach(track=>track.stop()); return; }
      settled = true; clearTimeout(timer); signal.removeEventListener("abort",abort);
      if (error) reject(error); else resolve(stream!);
    };
    const abort = () => finish(new DOMException("Stopped", "AbortError"));
    const timer = setTimeout(()=>finish(new Error("Microphone permission is taking a while. Allow microphone access, then try again.")),30000);
    signal.addEventListener("abort",abort,{once:true});
    navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})
      .then(stream=>finish(undefined,stream),error=>finish(error));
    if (signal.aborted) abort();
  });
  if (signal.aborted) {
    stream.getTracks().forEach((track) => track.stop());
    throw new DOMException("Stopped", "AbortError");
  }
  let capture: OpenRouterCapture | undefined;
  let context: AudioContext | undefined;
  let released = false;
  try {
    // Capture at the input device's native rate; encodeWav normalizes later.
    // The encoder preserves the API's mono 16 kHz contract.
    context = new AudioContext();
    const audioContext = context;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const mute = audioContext.createGain();
    mute.gain.value = 0;
    capture = {
      stream,
      context: audioContext,
      source,
      processor,
      mute,
      chunks: [],
      samples: 0,
    };
    const clip = capture;
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      let settled = false;
      let inputFrames = 0;
      let inputTimer: number | undefined;
      const started = performance.now();
      let lastSpeech = 0,
        noiseFloor = 0.00015;
      let voicedSamples = 0;
      const finish = (aborted = false, inputError?: Error) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        window.clearTimeout(inputTimer);
        try {
          if (aborted) throw new DOMException("Stopped", "AbortError");
          if (inputError) throw inputError;
          if (!clip.speechDetected)
            throw new Error(
              "No speech detected. Try speaking closer to your microphone, then start again.",
            );
          resolve(encodeWav(clip));
        } catch (error) {
          reject(error);
        } finally {
          releaseCapture(clip);
          released = true;
          options.onReady?.(null);
          onLevel(0);
        }
      };
      const abort = () => finish(true);
      signal.addEventListener("abort", abort, { once: true });
      processor.onaudioprocess = (event) => {
        if (settled) return;
        inputFrames++;
        window.clearTimeout(inputTimer);
        const samples = event.inputBuffer.getChannelData(0);
        let energy = 0;
        for (const sample of samples) energy += sample * sample;
        const rms = Math.sqrt(energy / samples.length);
        const elapsed = performance.now() - started;
        if (!clip.speechDetected && elapsed < 400 && rms < 0.0006)
          noiseFloor = noiseFloor * 0.9 + rms * 0.1;
        const threshold = Math.max(0.0006, noiseFloor * 2.5);
        if (rms > threshold) {
          voicedSamples += samples.length;
          if (voicedSamples >= audioContext.sampleRate * 0.12) clip.speechDetected = true;
          lastSpeech = elapsed;
        } else voicedSamples = 0;
        onLevel(rms > threshold ? Math.min(100, Math.max(8, Math.round(Math.sqrt(rms / 0.03) * 100))) : 0);
        const count = Math.min(
          samples.length,
          audioContext.sampleRate * clipSeconds - clip.samples,
        );
        if (count > 0) {
          clip.chunks.push(samples.slice(0, count));
          clip.samples += count;
        }
        if (
          clip.samples >= audioContext.sampleRate * clipSeconds ||
          (clip.speechDetected
            ? elapsed - lastSpeech >= (options.silenceMs ?? 1800)
            : silenceDecision(elapsed, lastSpeech, false) !== "continue")
        )
          finish();
      };
      source.connect(processor);
      processor.connect(mute);
      mute.connect(audioContext.destination);
      clip.timer = window.setTimeout(() => finish(), clipSeconds * 1000);
      inputTimer = window.setTimeout(()=>{if(!inputFrames)finish(false,new Error("Your microphone opened but no audio is arriving. Check your device’s microphone or Bluetooth input, then try again."));},4000);
      if (signal.aborted) { finish(true); return; }
      void audioContext.resume().then(()=>{if(!settled) options.onReady?.(() => finish());}).catch((error) => {
        if (!settled) { reject(error); finish(true); }
      });
    });
  } finally {
    if (capture) {
      if (!released) releaseCapture(capture);
    } else {
      stream.getTracks().forEach((track) => track.stop());
      if (context && context.state !== "closed") void context.close().catch(()=>{});
    }
  }
}
