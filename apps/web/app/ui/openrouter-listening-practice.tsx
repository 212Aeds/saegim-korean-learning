"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { paidFeaturesEnabled } from "../release";
import { Microphone, SpeakerHigh, Stop } from "./icons";
import { SoriMascot } from "./sori-mascot";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { transcriptRomanization } from "./transcript-romanization";
import { compareSpeech, silenceDecision } from "./speech-check";
import { encodeWav, maxClipSeconds, releaseCapture, type OpenRouterCapture } from "./openrouter-audio-capture";
import { playElevenLabsKorean, saveElevenLabsVoice, saveSpeechRate, selectedElevenLabsVoice, type ElevenLabsVoice } from "./speech";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function OpenRouterListeningPractice(props: Parameters<typeof PaidListeningPractice>[0]) {
  return paidFeaturesEnabled ? <PaidListeningPractice {...props} /> : <DevicePractice {...props} />;
}
function DevicePractice({korean,onResult}: Parameters<typeof PaidListeningPractice>[0]) {
  const [written,setWritten]=useState("");
  const [notice,setNotice]=useState("");
  return <section className="speech-practice"><span className="micro-label">LISTEN & WRITE</span><p>Listen with a local Korean voice, say it aloud yourself, then type the target phrase. No recording is uploaded.</p><button type="button" className="button button-soft" onClick={async()=>{const result=await playElevenLabsKorean(korean);if(!result.played)setNotice("No local Korean voice is available. You can still practice by writing.");}}>Listen on this device</button><form onSubmit={event=>{event.preventDefault();const matches=compareSpeech(korean,written,true).matches;setNotice(matches?"That matches the target wording.":"Compare with the target and try again. Another wording may also be valid.");onResult?.(written,matches);}}><KoreanInput value={written} onChange={setWritten} label="Write the Korean target" maxLength={500} openOnFocus={false} /><button className="button button-dark" disabled={!written.trim()}>Check written response</button></form>{notice && <p role="status">{notice}</p>}</section>;
}

function savedSpeechRate() {
  if (typeof window === "undefined") return 1;
  const rate = Number(window.localStorage.getItem("sori-speech-rate"));
  return rate >= 0.65 && rate <= 1.1 ? rate : 1;
}
function compareHangul(expected: string, heard: string) {
  return compareSpeech(expected, heard, true);
}

function PaidListeningPractice({ korean, english, expectedRomanization, variant = "combined", onResult, onVoiceChange, onPaceChange, selectedVoice }: {
  korean: string;
  selectedVoice?: ElevenLabsVoice;
  english?: string;
  expectedRomanization?: string;
  variant?: "combined" | "lesson-speaking";
  onResult?: (transcript: string, matches: boolean) => void;
  onVoiceChange?: (voice: ElevenLabsVoice) => void;
  onPaceChange?: (rate: number) => void;
}) {
  const [synthesisAvailable, setSynthesisAvailable] = useState(false);
  const [transcriptionAvailable, setTranscriptionAvailable] = useState(false);
  const [statusReady, setStatusReady] = useState(false);
  const [voice, setVoice] = useState<ElevenLabsVoice>("jessica");
  const [rate, setRate] = useState(savedSpeechRate);
  const [busy, setBusy] = useState<"tts" | "recording" | "transcribing" | null>(null);
  const [heard, setHeard] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [notice, setNotice] = useState("");
  const [writeInstead, setWriteInstead] = useState(false);
  const [written, setWritten] = useState("");
  const [feedback, setFeedback] = useState<"match" | "retry" | null>(null);
  const captureRef = useRef<OpenRouterCapture | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => setVoice(selectedVoice ?? selectedElevenLabsVoice()), [selectedVoice]);
  useEffect(() => saveSpeechRate(rate), [rate]);

  useEffect(() => {
    let active = true;
    if (!apiUrl) { setStatusReady(true); return; }
    void fetch(`${apiUrl}/v1/speech/status`, { credentials: "include", cache: "no-store", signal: AbortSignal.timeout(4_000) })
      .then(async (response) => response.ok ? response.json() as Promise<{ synthesis?: boolean; transcription?: boolean }> : null)
      .then((result) => { if (active) { setSynthesisAvailable(result?.synthesis === true); setTranscriptionAvailable(result?.transcription === true); setStatusReady(true); } })
      .catch(() => { if (active) setStatusReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    attemptRef.current += 1;
    releaseCapture(captureRef.current ?? undefined);
  }, []);

  async function listen() {
    if (!synthesisAvailable || !apiUrl || busy) return;
    setBusy("tts"); setNotice("Creating natural Korean audio…");
    try {
      const result = await playElevenLabsKorean(korean, voice, rate);
      setNotice(result.source === "elevenlabs"
        ? `${voice === "jessica" ? "Jessica" : "Chris"} is speaking. Listen once, then say the phrase.`
        : result.source === "device"
          ? "Natural audio is unavailable right now; Yuna’s device voice is speaking. Then say the phrase."
          : "Audio could not be played. Check the server connection and try again.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Natural Korean audio could not be created.");
    } finally { setBusy(null); }
  }

  function startCapture() {
    if (!transcriptionAvailable || !apiUrl || busy) return;
    const attempt = ++attemptRef.current;
    setHeard(""); setFeedback(null); setBusy("recording");
    setNotice("Requesting microphone permission…");
    void navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }).then(async (stream) => {
      if (attempt !== attemptRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      const context = new AudioContext({ sampleRate: 16_000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const mute = context.createGain(); mute.gain.value = 0;
      const capture: OpenRouterCapture = { stream, context, source, processor, mute, chunks: [], samples: 0 };
      captureRef.current = capture;
      const sampleLimit = Math.min(context.sampleRate * maxClipSeconds, Math.floor((2 * 1024 * 1024 - 44) / 2));
      const startedAt = performance.now();
      let lastSpeechMs = 0;
      let noiseFloor = 0.001;
      processor.onaudioprocess = (event) => {
        if (captureRef.current !== capture) return;
        const samples = event.inputBuffer.getChannelData(0);
        let energy = 0;
        for (const sample of samples) energy += sample * sample;
        const rms = Math.sqrt(energy / samples.length);
        const elapsedMs = performance.now() - startedAt;
        if (!capture.speechDetected && elapsedMs < 400) noiseFloor = Math.min(0.006, noiseFloor * 0.9 + rms * 0.1);
        if (rms > Math.max(0.003, noiseFloor * 2.5)) { capture.speechDetected = true; lastSpeechMs = elapsedMs; }
        setMicLevel(Math.min(100, Math.round(rms * 1_000)));
        const count = Math.min(samples.length, sampleLimit - capture.samples);
        if (count > 0) { capture.chunks.push(samples.slice(0, count)); capture.samples += count; }
        const decision = silenceDecision(elapsedMs, lastSpeechMs, capture.speechDetected === true);
        if (capture.samples >= sampleLimit || decision !== "continue") void stopAndTranscribe(capture, attempt);
      };
      source.connect(processor); processor.connect(mute); mute.connect(context.destination);
      capture.timer = window.setTimeout(() => void stopAndTranscribe(capture, attempt), maxClipSeconds * 1_000);
      await context.resume();
      setNotice("Listening · say the Korean phrase. Recording stops automatically after a short silence; you can also tap Stop.");
    }).catch(() => {
      releaseCapture(captureRef.current ?? undefined);
      captureRef.current = null;
      if (attempt === attemptRef.current) { setBusy(null); setNotice("Microphone access is unavailable. Allow access for this site, or use the typed/local practice below."); }
    });
  }

  async function stopAndTranscribe(capture: OpenRouterCapture, attempt: number) {
    if (captureRef.current !== capture || attempt !== attemptRef.current) return;
    captureRef.current = null;
    setMicLevel(0);
    window.clearTimeout(capture.timer);
    setBusy("transcribing"); setNotice("Checking your answer…");
    let wav: ArrayBuffer | undefined;
    try {
      if (!capture.speechDetected) throw new Error("No speech detected. Try again closer to your microphone, or switch to writing.");
      wav = encodeWav(capture); releaseCapture(capture);
      const response = await fetch(`${apiUrl}/v1/speech/transcribe`, {
        method: "POST", credentials: "include", cache: "no-store", signal: AbortSignal.timeout(20_000),
        headers: { "Content-Type": "audio/wav", "X-Saegim-Speech-Consent": "true" }, body: wav,
      });
      if (!response.ok) throw new Error("Couldn’t hear your answer clearly. Try again or switch to writing.");
      const result = await response.json() as { transcript?: unknown };
      if (typeof result.transcript !== "string" || !result.transcript.trim()) throw new Error("No words were detected. Check the live mic level, speak a little closer, and try again.");
      setHeard(result.transcript.trim());
      const comparison = compareHangul(korean, result.transcript);
      setFeedback(comparison.matches ? "match" : "retry");
      onResult?.(result.transcript.trim(), comparison.matches);
      setNotice(comparison.matches
        ? "Nice work! The recognized Korean matches the target."
        : `Try again. Target ${comparison.targetBlock || "(ending)"} · heard ${comparison.heardBlock}. For a short word, speak clearly after recording starts.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The clip could not be transcribed.");
    } finally {
      releaseCapture(capture);
      if (wav) new Uint8Array(wav).fill(0);
      setBusy(null);
    }
  }

  function submitWriting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = written.trim();
    if (!value) return;
    const hasHangul = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(value);
    const matches = hasHangul
      ? compareSpeech(korean, value).matches
      : value.toLocaleLowerCase().replace(/[^a-z]/gu, "") === (expectedRomanization ?? "").toLocaleLowerCase().replace(/[^a-z]/gu, "");
    onResult?.(value, matches);
    setFeedback(matches ? "match" : "retry");
    setNotice(matches ? "That matches the target." : `Compare what you wrote with the target ${korean}, then try again.`);
  }

  return (
    <section className={`openrouter-practice ${variant === "lesson-speaking" ? "lesson-speaking-exercise" : ""}`} aria-label={variant === "lesson-speaking" ? "Speaking exercise" : "Natural listening and pronunciation practice"} data-listening={busy === "recording" || busy === "transcribing"}>
      {variant === "lesson-speaking" ? (
        <>
          <div className="lesson-speaking-meter">
            <SoriMascot className="lesson-speaking-mascot" />
            <div>
              <div className="speech-input-meter-label"><span>Microphone input</span><strong>{busy === "recording" ? micLevel >= 4 ? "Sound detected" : "Listening…" : busy === "transcribing" ? "Checking speech…" : "Ready"}</strong></div>
              <div className="speech-input-meter-track" role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}><span style={{ transform: `scaleX(${micLevel / 100})` }} /></div>
            </div>
          </div>
          {!writeInstead ? (
            <div className="speech-practice-actions">
              {busy === "recording" ? <button type="button" className="button button-dark" onClick={() => { if (captureRef.current) void stopAndTranscribe(captureRef.current, attemptRef.current); }}><Stop size={16} /> Stop & check</button> :
                <button type="button" className="button button-dark" onClick={startCapture} disabled={!transcriptionAvailable || busy !== null}><Microphone size={16} /> {busy === "transcribing" ? "Checking speech…" : "Record my answer"}</button>}
              <button type="button" className="button button-quiet" onClick={() => { setWriteInstead(true); setNotice(""); }} disabled={busy !== null}>Can’t use your mic right now? Write instead</button>
            </div>
          ) : (
            <form className="speech-typed lesson-speaking-write" onSubmit={submitWriting}>
              <span>Write the Korean or its romanization</span><KoreanInput value={written} onChange={setWritten} label="Write the Korean or its romanization" />
              <div className="speech-practice-actions"><button className="button button-dark" type="submit" disabled={!written.trim()}>Check writing</button><button type="button" className="button button-quiet" onClick={() => { setWriteInstead(false); setWritten(""); setNotice(""); }}>Use microphone</button></div>
            </form>
          )}
          {notice && <p className="speech-practice-status" role="status" aria-live="polite">{notice}</p>}
          {heard && <div className="speech-transcript"><span className="micro-label">YOUR ANSWER</span><p lang="ko">{heard}</p><p className="transcript-romanization" lang="ko-Latn">{transcriptRomanization(heard)}</p></div>}
          {statusReady && !transcriptionAvailable && <small>Speech recognition is unavailable right now. Switch to writing to continue this exercise.</small>}
        </>
      ) : (
        <>
      <h4><SpeakerHigh size={16} /> Listen, then speak</h4>
      <div className="openrouter-practice-body">
        <p className="openrouter-practice-target"><strong lang="ko">{korean}</strong>{english && <span>{english}</span>}</p>
        <label className="openrouter-voice-picker">Korean voice
          <select value={voice} onChange={(event) => { const next = event.target.value as ElevenLabsVoice; setVoice(next); saveElevenLabsVoice(next); onVoiceChange?.(next); }}>
            <option value="jessica">Jessica</option><option value="chris">Chris</option>
          </select>
        </label>
        <label className="openrouter-pace-picker"><span>Speaking pace <strong>{rate.toFixed(2)}×</strong></span><input type="range" min="0.65" max="1.1" step="0.05" value={rate} onChange={(event) => { const next = Number(event.target.value); setRate(next); onPaceChange?.(next); }} aria-label="Speaking pace" /></label>
        <div className="speech-practice-actions">
          <button type="button" className="button button-soft" onClick={() => void listen()} disabled={!synthesisAvailable || busy !== null}>
            <SpeakerHigh size={16} /> {busy === "tts" ? "Preparing voice…" : `Listen with ${voice === "jessica" ? "Jessica" : "Chris"}`}
          </button>
          {busy === "recording" ? <button type="button" className="button button-dark" onClick={() => { if (captureRef.current) void stopAndTranscribe(captureRef.current, attemptRef.current); }}><Stop size={16} /> Stop & transcribe</button> :
            <button type="button" className="button button-quiet" onClick={startCapture} disabled={!transcriptionAvailable || busy !== null}><Microphone size={16} /> Record my Korean</button>}
        </div>
        {busy === "recording" && <div className="speech-input-meter" data-heard={micLevel >= 4}>
          <div className="speech-input-meter-label"><span>Live microphone level</span><strong>{micLevel >= 4 ? "Sound reaching mic" : "Quiet · no sound yet"}</strong></div>
          <div className="speech-input-meter-track" role="meter" aria-label="Live microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}><span style={{ transform: `scaleX(${micLevel / 100})` }} /></div>
        </div>}
        {notice && <p className="speech-practice-status" role="status" aria-live="polite">{notice}</p>}
        {heard && <div className="speech-transcript"><span className="micro-label">YOUR ANSWER</span><p lang="ko">{heard}</p><p className="transcript-romanization" lang="ko-Latn">{transcriptRomanization(heard)}</p></div>}
      </div>
        </>
      )}
      <WordReference word={korean} />
      {feedback && <div className={`speech-feedback ${feedback}`} role="status"><SoriMascot className="speech-feedback-mascot" thumbsUp={feedback === "match"} /><strong>{feedback === "match" ? "You got it!" : "Try again — you’re learning."}</strong></div>}
    </section>
  );
}
