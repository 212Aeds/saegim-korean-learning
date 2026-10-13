"use client";
import { localSpeechUrl, localSpeechAvailable, transcribeOnLocalServer } from "./local-speech-server";
import { paidFeaturesEnabled } from "../release";

import { useEffect, useRef, useState } from "react";
import { stopKoreanPlayback } from "./speech";

export type SpeechPracticeState = "ready" | "requesting" | "listening" | "transcribing" | "result" | "error";
export function normalizedHangul(text: string) {
  return text.normalize("NFC").replace(/[^\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/g, "");
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const maxBytes = 2 * 1024 * 1024;
const maxSeconds = 15;
type Capture = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  mute: GainNode;
  chunks: Float32Array[];
  samples: number;
  timer?: number;
};

function disposeCapture(capture: Capture | undefined) {
  if (!capture) return;
  window.clearTimeout(capture.timer);
  capture.processor.onaudioprocess = null;
  capture.source.disconnect();
  capture.processor.disconnect();
  capture.mute.disconnect();
  capture.stream.getTracks().forEach((track) => track.stop());
  void capture.context.close().catch(() => {});
  capture.chunks.forEach((chunk) => chunk.fill(0));
  capture.chunks = [];
}

function wavBytes(capture: Capture): ArrayBuffer {
  const rate = capture.context.sampleRate;
  if (!capture.samples || capture.samples > rate * maxSeconds || 44 + capture.samples * 2 > maxBytes) throw new Error();
  const buffer = new ArrayBuffer(44 + capture.samples * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  ascii(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); ascii(8, "WAVE");
  ascii(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, "data");
  view.setUint32(40, capture.samples * 2, true);
  let offset = 44;
  for (const chunk of capture.chunks) {
    for (const sample of chunk) {
      const bounded = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, bounded < 0 ? bounded * 0x8000 : bounded * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

export function SpeechPractice({ onTranscript, onClear, feedback }: {
  onTranscript: (transcript: string) => void;
  onClear: () => void;
  feedback: "match" | "try again" | null;
}) {
  const [state, setState] = useState<SpeechPracticeState>("ready");
  const [message, setMessage] = useState("Type a response, or choose to try saying it.");
  const [showConsent, setShowConsent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [typed, setTyped] = useState("");
  const [transcript, setTranscript] = useState("");
  const capture = useRef<Capture | undefined>(undefined);
  const pending = useRef<AbortController | undefined>(undefined);
  const sequence = useRef(0);
  const busy = useRef(false);
  const uploading = useRef(false);

  function release() {
    disposeCapture(capture.current);
    capture.current = undefined;
    pending.current?.abort();
    pending.current = undefined;
  }

  useEffect(() => () => {
    sequence.current += 1;
    release();
  }, []);

  function cancel(clear = false) {
    sequence.current += 1;
    release();
    busy.current = false;
    setState("ready");
    setConsented(false);
    setShowConsent(false);
    setTranscript("");
    if (clear) setTyped("");
    onClear();
    setMessage(clear ? "Transcript cleared." : "Attempt canceled. You can type your response.");
  }

  async function stopAndTranscribe(attempt: number) {
    const recording = capture.current;
    if (!recording || sequence.current !== attempt) return;
    capture.current = undefined;
    setState("transcribing");
    setMessage("Transcribing your short clip…");
    let audio: ArrayBuffer | undefined;
    let timer: number | undefined;
    try {
      audio = wavBytes(recording);
      disposeCapture(recording);
      const controller = new AbortController();
      pending.current = controller;
      timer = window.setTimeout(() => controller.abort(), localSpeechUrl ? 180_000 : 20_000);
      uploading.current = true;
      let data: unknown;
      if (localSpeechUrl) data = {transcript:await transcribeOnLocalServer(new Blob([audio],{type:"audio/wav"}),controller.signal)};
      else {
        const response = await fetch(`${apiUrl}/v1/speech/transcribe`, {
          method: "POST", credentials: "include", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "audio/wav", "X-Saegim-Speech-Consent": "true" }, body: audio,
        });
        if (!response.ok) {
          throw new Error(response.status === 429 ? "The speech provider is temporarily busy. Type your response or try again." :
            response.status === 401 ? "Sign in to use speech, or type your response." :
              "Speech could not be transcribed. Try again or type your response.");
        }
        data = await response.json();
      }
      if (!data || typeof data !== "object" || !("transcript" in data) ||
          typeof data.transcript !== "string" || !data.transcript.trim() || data.transcript.length > 2_000) throw new Error();
      if (sequence.current !== attempt) return;
      setTranscript(data.transcript.trim());
      onTranscript(data.transcript.trim());
      setState("result");
      setMessage("Transcript ready. This compares the text of your response.");
    } catch (error) {
      disposeCapture(recording);
      if (sequence.current !== attempt) return;
      setState("error");
      setMessage(error instanceof Error && error.message ? error.message : "Speech could not be transcribed. Try again or type your response.");
    } finally {
      window.clearTimeout(timer);
      if (audio) new Uint8Array(audio).fill(0);
      uploading.current = false;
      if (sequence.current === attempt) {
        pending.current = undefined;
        busy.current = false;
      }
    }
  }

  async function start() {
    if (busy.current || uploading.current || !consented) return;
    busy.current = true;
    const attempt = ++sequence.current;
    setTranscript("");
    onClear();
    setShowConsent(false);
    // Consent applies to this one clip, including an automatic stop at the limit.
    setConsented(false);
    setState("requesting");
    setMessage("Checking speech availability…");
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    let timer: number | undefined;
    try {
      if (!apiUrl && !localSpeechUrl) throw new Error("Speech is unavailable. Type your response instead.");
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !AudioContext.prototype.createScriptProcessor) {
        throw new Error("Recording is unsupported in this browser. Type your response instead.");
      }
      const controller = new AbortController();
      pending.current = controller;
      timer = window.setTimeout(() => controller.abort(), 5_000);
      if (localSpeechUrl) { if (!(await localSpeechAvailable())) throw new Error("Local speech is not ready. Type your response instead."); }
      else {
      const status = await fetch(`${apiUrl}/v1/speech/status`, {
        credentials: "include", cache: "no-store", signal: controller.signal,
      });
      window.clearTimeout(timer);
      if (sequence.current !== attempt) return;
      if (status.status === 401) throw new Error("Sign in to use speech, or type your response.");
      if (!status.ok || (await status.json()).available !== true) throw new Error("Speech is unavailable. Type your response instead.");
      }
      if (sequence.current !== attempt) return;
      pending.current = undefined;
      stopKoreanPlayback();
      setMessage("Requesting microphone permission…");
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 }, video: false });
      if (sequence.current !== attempt) { stream.getTracks().forEach((track) => track.stop()); return; }
      context = new AudioContext({ sampleRate: 16_000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const mute = context.createGain();
      mute.gain.value = 0;
      const recording: Capture = { stream, context, source, processor, mute, chunks: [], samples: 0 };
      capture.current = recording;
      // Bound capture even if this browser stalls while resuming its audio engine.
      recording.timer = window.setTimeout(() => void stopAndTranscribe(attempt), maxSeconds * 1000);
      await context.resume();
      if (sequence.current !== attempt || capture.current !== recording) return;
      let heardSound=false,lastSound=performance.now();
      const sampleLimit = Math.min(Math.floor(context.sampleRate * maxSeconds), Math.floor((maxBytes - 44) / 2));
      processor.onaudioprocess = (event) => {
        if (capture.current !== recording || sequence.current !== attempt) return;
        const input = event.inputBuffer.getChannelData(0);
        let energy=0;for(const sample of input)energy+=sample*sample;
        if(Math.sqrt(energy/input.length)>=0.004){heardSound=true;lastSound=performance.now();}
        else if(heardSound && performance.now()-lastSound>1800){void stopAndTranscribe(attempt);return;}
        const count = Math.min(input.length, sampleLimit - recording.samples);
        if (count > 0) { recording.chunks.push(input.slice(0, count)); recording.samples += count; }
        if (recording.samples >= sampleLimit) void stopAndTranscribe(attempt);
      };
      source.connect(processor); processor.connect(mute); mute.connect(context.destination);
      setState("listening");
      setMessage("Listening · stops at 15 seconds or 2 MB. Stop when you finish the phrase.");
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== "closed") void context.close().catch(() => {});
      if (sequence.current !== attempt) return;
      release();
      busy.current = false;
      setState("error");
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setMessage(denied ? "Microphone permission was denied. Type your response instead." :
        error instanceof Error && error.message && !(error instanceof DOMException) ? error.message :
          "Speech is unavailable. Type your response instead.");
    } finally {
      window.clearTimeout(timer);
    }
  }

  const active = state === "requesting" || state === "listening" || state === "transcribing";
  return (
    <section className="speech-practice" aria-label="Try saying it" data-state={state}>
      <h3>Try saying it</h3>
      <p className="speech-practice-status" role="status" aria-live="polite">{message}</p>
      <div className="speech-practice-actions">
        {!active && (localSpeechUrl || paidFeaturesEnabled) && <button className="button button-soft" onClick={() => { setShowConsent(true); setConsented(false); }}>Try saying it</button>}
        {state === "listening" && <button className="button button-dark" onClick={() => void stopAndTranscribe(sequence.current)}>Stop & transcribe</button>}
        {active && <button className="button button-quiet" onClick={() => cancel()}>Cancel</button>}
      </div>
      {showConsent && <div className="speech-consent">
        <p>A short recording is sent to your configured local speech server for transcription. It is not sent to a paid speech provider. The recording is discarded after this attempt.</p>
        <label><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /> I agree to send this one clip for transcription.</label>
        <div className="speech-practice-actions">
          <button className="button button-dark" disabled={!consented} onClick={() => void start()}>Start this attempt</button>
          <button className="button button-quiet" onClick={() => { setShowConsent(false); setConsented(false); setMessage("You can type your response without sending audio."); }}>Decline & type</button>
        </div>
      </div>}
      <form className="speech-typed" onSubmit={(event) => {
        event.preventDefault();
        if (!typed.trim() || busy.current) return;
        setTranscript(typed.trim()); onTranscript(typed.trim()); setState("result");
        setMessage("Typed response ready. This compares the text of your response.");
      }}>
        <label htmlFor="speech-typed-response">Or type the Korean phrase</label>
        <input id="speech-typed-response" lang="ko" value={typed} maxLength={2_000} autoComplete="off" onChange={(event) => setTyped(event.target.value)} />
        <button className="button button-quiet" disabled={active || !typed.trim()}>Check typed response</button>
      </form>
      {transcript && <div className="speech-transcript">
        <p lang="ko">{transcript}</p>
        {feedback && <strong role="status">{feedback === "match" ? "Match" : "Try again"}</strong>}
      </div>}
      <button className="button button-quiet" onClick={() => cancel(true)}>Clear transcript</button>
    </section>
  );
}
