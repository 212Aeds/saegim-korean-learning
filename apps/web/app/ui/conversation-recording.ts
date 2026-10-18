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
    try { context = new AudioContext({ sampleRate: 16000 }); }
    catch (error) { if (error instanceof DOMException && error.name === "NotSupportedError") context = new AudioContext(); else throw error; }
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
          options.onReady?.(null);
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
