"use client";
import { SpeechFeedback } from "./speech-feedback";

import { useEffect, useRef, useState } from "react";
import { Microphone, Stop } from "./icons";
import { stopKoreanPlayback } from "./speech";
import { SoriMascot } from "./sori-mascot";
import { OpenRouterListeningPractice } from "./openrouter-listening-practice";

type RecognitionAlternative = { transcript?: string };
type RecognitionResult = { 0?: RecognitionAlternative; isFinal?: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionError = { error?: string };
type LocalRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  processLocally?: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = {
  new (): LocalRecognition;
  available?: (options: { langs: string[]; processLocally: true }) => Promise<string>;
  install?: (options: { langs: string[]; processLocally: true }) => Promise<boolean>;
};
type ListeningState = "ready" | "downloading" | "listening" | "transcribing" | "stopping";

function recognitionConstructor(): RecognitionConstructor | null {
  const speechWindow = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function normalizedHangul(text: string) {
  return text.normalize("NFC").replace(/[^\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/g, "");
}

function normalizedRomanization(text: string) {
  return text.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function compareAnswer(value: string, expectedKorean: string, expectedRomanization?: string) {
  const heardHangul = normalizedHangul(value);
  const targetHangul = normalizedHangul(expectedKorean);
  if (heardHangul && targetHangul) return heardHangul === targetHangul;
  const heardLatin = normalizedRomanization(value);
  const targetLatin = normalizedRomanization(expectedRomanization ?? "");
  return Boolean(heardLatin && targetLatin && heardLatin === targetLatin);
}

function transcriptFeedback(expectedKorean: string, transcript: string, matches: boolean) {
  if (matches) return "Great match. Your spoken answer matches the target phrase.";
  const heard = normalizedHangul(transcript);
  const target = normalizedHangul(expectedKorean);
  if (!heard || !target) return `The browser heard “${transcript}.” Compare it with “${expectedKorean}” and try once more.`;
  let firstDifference = 0;
  while (firstDifference < heard.length && firstDifference < target.length && heard[firstDifference] === target[firstDifference]) firstDifference += 1;
  const targetBlock = Array.from(expectedKorean.replace(/\s/gu, ""))[firstDifference];
  if (heard.length < target.length) return `The browser heard “${transcript}.” It may have missed a syllable near ${targetBlock ? `“${targetBlock}”` : "the end"}. Try a slower, complete phrase.`;
  if (heard.length > target.length) return `The browser heard “${transcript}.” It picked up an extra sound; pause between syllable blocks and try again.`;
  return `The browser heard “${transcript},” while the target is “${expectedKorean}.” Focus on syllable “${targetBlock ?? expectedKorean}” and try again.`;
}

export function LocalSpeechPractice({ expectedKorean, expectedRomanization, expectedTranslation, onResult, heading = "Try saying it" }: {
  expectedKorean: string;
  expectedRomanization?: string;
  expectedTranslation?: string;
  onResult?: (transcript: string, matches: boolean) => void;
  heading?: string;
}) {
  const recognition = useRef<LocalRecognition | null>(null);
  const worker = useRef<Worker | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const micTestStream = useRef<MediaStream | null>(null);
  const meterContext = useRef<AudioContext | null>(null);
  const meterAnalyser = useRef<AnalyserNode | null>(null);
  const meterSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const meterFrame = useRef<number | null>(null);
  const meterUpdateAt = useRef(0);
  const peakMicLevel = useRef(0);
  const audioChunks = useRef<Blob[]>([]);
  const stopTimer = useRef<number | undefined>(undefined);
  const stopRequested = useRef(false);
  const latestSpeechTranscript = useRef("");
  const handledSpeech = useRef(false);
  const [supported, setSupported] = useState(false);
  const [localRecognitionReady, setLocalRecognitionReady] = useState(false);
  const [localModelReady, setLocalModelReady] = useState(false);
  const [modelAvailable, setModelAvailable] = useState(false);
  const [modelProgress, setModelProgress] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [micSignalDetected, setMicSignalDetected] = useState(false);
  const [micTestState, setMicTestState] = useState<"off" | "requesting" | "active" | "blocked">("off");
  const [canInstallPack, setCanInstallPack] = useState(false);
  const [installingPack, setInstallingPack] = useState(false);
  const [listeningState, setListeningState] = useState<ListeningState>("ready");
  const [typed, setTyped] = useState("");
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [message, setMessage] = useState("Speech stays on this device when Korean offline recognition is available; typing always works.");

  function clearStopTimer() {
    if (stopTimer.current !== undefined) window.clearTimeout(stopTimer.current);
    stopTimer.current = undefined;
  }

  function stopMicrophoneMeter() {
    if (meterFrame.current !== null) cancelAnimationFrame(meterFrame.current);
    meterFrame.current = null;
    meterSource.current?.disconnect();
    meterAnalyser.current?.disconnect();
    meterSource.current = null;
    meterAnalyser.current = null;
    const context = meterContext.current;
    meterContext.current = null;
    if (context && context.state !== "closed") void context.close();
    setMicLevel(0);
  }

  async function startMicrophoneMeter(microphone: MediaStream) {
    stopMicrophoneMeter();
    const context = new AudioContext();
    meterContext.current = context;
    await context.resume();
    if (stream.current !== microphone && micTestStream.current !== microphone || context.state === "closed") {
      if (context.state !== "closed") void context.close();
      return;
    }
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    const source = context.createMediaStreamSource(microphone);
    source.connect(analyser);
    meterAnalyser.current = analyser;
    meterSource.current = source;
    const samples = new Float32Array(analyser.fftSize);
    const update = (now: number) => {
      if (meterAnalyser.current !== analyser) return;
      analyser.getFloatTimeDomainData(samples);
      let sumSquares = 0;
      for (const sample of samples) sumSquares += sample * sample;
      const level = Math.min(100, Math.round(Math.sqrt(sumSquares / samples.length) * 2_200));
      peakMicLevel.current = Math.max(peakMicLevel.current, level);
      if (now - meterUpdateAt.current > 100) {
        meterUpdateAt.current = now;
        setMicLevel(level);
        setMicSignalDetected(level >= 8);
      }
      meterFrame.current = requestAnimationFrame(update);
    };
    meterFrame.current = requestAnimationFrame(update);
  }

  async function toggleMicCheck() {
    if (micTestStream.current) {
      micTestStream.current.getTracks().forEach((track) => track.stop());
      micTestStream.current = null;
      stopMicrophoneMeter();
      setMicTestState("off");
      setMicSignalDetected(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicTestState("blocked");
      setMessage("This browser cannot access a microphone. Check browser support or type your answer.");
      return;
    }
    setMicTestState("requesting");
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micTestStream.current = microphone;
      peakMicLevel.current = 0;
      meterUpdateAt.current = 0;
      setMicLevel(0);
      setMicSignalDetected(false);
      await startMicrophoneMeter(microphone);
      setMicTestState("active");
      setMessage("Mic check is live. Speak a few words and watch the level move; this check does not record or send audio.");
    } catch {
      micTestStream.current?.getTracks().forEach((track) => track.stop());
      micTestStream.current = null;
      stopMicrophoneMeter();
      setMicTestState("blocked");
      setMessage("Microphone access was blocked. Allow microphone access for this site, then try the check again.");
    }
  }

  function finish(value: string, source: "speech" | "typed" = "typed") {
    const answer = value.trim();
    if (!answer) return false;
    clearStopTimer();
    setTranscript(answer);
    setLiveTranscript("");
    const matches = compareAnswer(answer, expectedKorean, expectedRomanization);
    onResult?.(answer, matches);
    setMessage(source === "speech"
      ? transcriptFeedback(expectedKorean, answer, matches)
      : matches ? "Nice work — the Korean or romanized answer matches." : `Not quite. The target is “${expectedKorean}.” You can type Hangul or romanization such as “annyeong.”`);
    return true;
  }

  useEffect(() => {
    const Constructor = recognitionConstructor();
    setSupported(Boolean(Constructor) || (Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined"));
    setModelAvailable(Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined");
    if (Constructor?.available) {
      void Constructor.available({ langs: ["ko-KR"], processLocally: true }).then((result) => {
        setLocalRecognitionReady(result === "available");
        setCanInstallPack(result === "downloadable" && Boolean(Constructor.install));
        if (result === "unavailable") setMessage("This browser cannot recognize Korean on-device. Type your answer here, or try a browser with an offline Korean speech pack.");
      }).catch(() => setMessage("On-device Korean recognition is unavailable here. You can type your answer instead."));
    } else if (Constructor) {
      setMessage("This browser cannot confirm on-device Korean recognition. Type your answer instead.");
    } else {
      setMessage("This browser has no built-in speech recognition. You can enable free, offline Korean recognition with a one-time model download.");
    }
    return () => {
      clearStopTimer();
      recognition.current?.abort();
      recognition.current = null;
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      micTestStream.current?.getTracks().forEach((track) => track.stop());
      micTestStream.current = null;
      stopMicrophoneMeter();
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  function enableOfflineModel() {
    if (worker.current || !modelAvailable) return;
    setListeningState("downloading");
    setMessage("Loading the free Korean speech model on this device. The first download is about 50 MB.");
    try {
      const asrWorker = new Worker(new URL("./korean-asr.worker.ts", import.meta.url), { type: "module" });
      worker.current = asrWorker;
      asrWorker.onmessage = (event: MessageEvent<{ type: string; detail?: string; text?: string; message?: string }>) => {
        const result = event.data;
        if (result.type === "progress") {
          setModelProgress(result.detail ?? "Downloading model files…");
          setMessage(`Preparing offline Korean recognition · ${result.detail ?? "Downloading model files…"}`);
        } else if (result.type === "ready") {
          setLocalModelReady(true);
          setListeningState("ready");
          setModelProgress("");
          setMessage("Offline Korean recognition is ready. Your microphone audio will be processed on this device.");
        } else if (result.type === "result") {
          setListeningState("ready");
          setLiveTranscript("");
          const heard = result.text?.trim() ?? "";
          if (heard) finish(heard, "speech");
          else setMessage(peakMicLevel.current >= 8
            ? "The mic picked up sound, but the model could not make out Korean words. Try a short Korean phrase, closer to the mic, with less background noise."
            : "The mic level stayed very low, so the app received little or no sound. Check the selected microphone and browser permission, then try again.");
        } else if (result.type === "error") {
          setListeningState("ready");
          if (!localModelReady) {
            asrWorker.terminate();
            worker.current = null;
          }
          setMessage(`Offline recognition could not load: ${result.message ?? "please check your connection and try again."} You can still type your answer.`);
        }
      };
      asrWorker.onerror = () => {
        setListeningState("ready");
        asrWorker.terminate();
        worker.current = null;
        setMessage("Offline speech recognition could not start in this browser. You can still type your answer.");
      };
      asrWorker.postMessage({ type: "load" });
    } catch {
      setListeningState("ready");
      setMessage("Offline speech recognition could not start in this browser. You can still type your answer.");
    }
  }

  async function transcribeRecording(blob: Blob) {
    try {
      if (!blob.size) throw new Error("No audio was captured. Check microphone access and try again.");
      setListeningState("transcribing");
      setMessage("Checking your Korean pronunciation on this device…");
      const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor || !worker.current) throw new Error("Local audio processing is not available here.");
      const context = new AudioContextConstructor();
      try {
        const decoded = await context.decodeAudioData(await blob.arrayBuffer());
        const channelCount = decoded.numberOfChannels;
        const sourceLength = decoded.length;
        const sourceRate = decoded.sampleRate;
        const targetRate = 16_000;
        const outputLength = Math.floor(sourceLength * targetRate / sourceRate);
        const audio = new Float32Array(outputLength);
        for (let index = 0; index < outputLength; index += 1) {
          const sourcePosition = index * sourceRate / targetRate;
          const leftIndex = Math.floor(sourcePosition);
          const fraction = sourcePosition - leftIndex;
          let sample = 0;
          for (let channel = 0; channel < channelCount; channel += 1) {
            const data = decoded.getChannelData(channel);
            const left = data[leftIndex] ?? 0;
            const right = data[Math.min(leftIndex + 1, sourceLength - 1)] ?? left;
            sample += left + (right - left) * fraction;
          }
          audio[index] = sample / channelCount;
        }
        if (audio.length < targetRate / 2) throw new Error("That recording was too short. Hold the microphone button while you say the whole phrase.");
        setLiveTranscript("Audio captured · analyzing locally…");
        worker.current.postMessage({ type: "transcribe", audio }, [audio.buffer]);
      } finally {
        await context.close();
      }
    } catch (error) {
      setListeningState("ready");
      setLiveTranscript("");
      setMessage(error instanceof Error ? error.message : "The recording could not be processed locally. Try again or type your answer.");
    }
  }

  function stopLocalRecording() {
    if (recorder.current?.state !== "recording") return;
    clearStopTimer();
    setListeningState("stopping");
    setMessage("Finishing the recording…");
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function startLocalRecording() {
    if (!localModelReady) {
      setMessage("Load the offline Korean model first. It stays in your browser for future practice.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("This browser cannot record microphone audio. Type your answer or use an up-to-date browser.");
      return;
    }
    try {
      if (micTestStream.current) {
        micTestStream.current.getTracks().forEach((track) => track.stop());
        micTestStream.current = null;
        stopMicrophoneMeter();
        setMicTestState("off");
      }
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      stream.current = microphone;
      audioChunks.current = [];
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const activeRecorder = new MediaRecorder(microphone, preferred ? { mimeType: preferred } : undefined);
      recorder.current = activeRecorder;
      activeRecorder.ondataavailable = (event) => { if (event.data.size) audioChunks.current.push(event.data); };
      activeRecorder.onstop = () => {
        microphone.getTracks().forEach((track) => track.stop());
        stopMicrophoneMeter();
        stream.current = null;
        recorder.current = null;
        const blob = new Blob(audioChunks.current, { type: activeRecorder.mimeType || "audio/webm" });
        audioChunks.current = [];
        void transcribeRecording(blob);
      };
      activeRecorder.onerror = () => {
        microphone.getTracks().forEach((track) => track.stop());
        stopMicrophoneMeter();
        stream.current = null;
        recorder.current = null;
        setListeningState("ready");
        setMessage("The browser could not record audio. Check microphone access or type your answer.");
      };
      activeRecorder.start();
      peakMicLevel.current = 0;
      meterUpdateAt.current = 0;
      setMicLevel(0);
      setMicSignalDetected(false);
      setListeningState("listening");
      setTranscript("");
      setLiveTranscript("Listening · say the Korean phrase now");
      setMessage("Listening on this device. Say the complete phrase, then tap Stop.");
      void startMicrophoneMeter(microphone).catch(() => {
        setMessage("Recording is active, but the live meter is unavailable in this browser.");
      });
      stopTimer.current = window.setTimeout(stopLocalRecording, 12_000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      stopMicrophoneMeter();
      stream.current = null;
      setListeningState("ready");
      setMessage("Microphone access is blocked. Allow microphone access for this site, or type your answer.");
    }
  }

  async function installLanguagePack() {
    const Constructor = recognitionConstructor();
    if (!Constructor?.install || installingPack) return;
    setInstallingPack(true);
    setMessage("Downloading the browser’s Korean speech pack to this device…");
    try {
      const installed = await Constructor.install({ langs: ["ko-KR"], processLocally: true });
      setCanInstallPack(false);
      setLocalRecognitionReady(installed);
      setMessage(installed ? "Korean offline speech is ready on this device. Try speaking now." : "The Korean pack could not be installed. Type your answer or try again later.");
    } catch {
      setMessage("The Korean pack could not be installed. Type your answer or try again later.");
    } finally {
      setInstallingPack(false);
    }
  }

  function stopListening(showFinishingMessage = true) {
    if (!recognition.current || stopRequested.current) return;
    stopRequested.current = true;
    setListeningState("stopping");
    if (showFinishingMessage) setMessage("Finishing recognition…");
    clearStopTimer();
    stopTimer.current = window.setTimeout(() => {
      const partialText = latestSpeechTranscript.current.trim();
      recognition.current?.abort();
      recognition.current = null;
      stopRequested.current = false;
      setListeningState("ready");
      if (partialText && !handledSpeech.current) {
        handledSpeech.current = true;
        finish(partialText, "speech");
      } else {
        setLiveTranscript("");
        setMessage("No Korean speech was detected. Move closer to the microphone and try again, or type your answer.");
      }
    }, 4_000);
    try { recognition.current.stop(); }
    catch {
      clearStopTimer();
      recognition.current = null;
      stopRequested.current = false;
      setListeningState("ready");
      setMessage("Recognition stopped. No speech was detected; try again or type your answer.");
    }
  }

  function startListening() {
    if (listeningState === "listening") {
      stopListening();
      return;
    }
    if (listeningState === "stopping" || listeningState === "transcribing" || listeningState === "downloading") return;
    if (!localRecognitionReady && localModelReady) {
      stopKoreanPlayback();
      setTranscript("");
      void startLocalRecording();
      return;
    }
    if (!localRecognitionReady && modelAvailable) {
      setMessage("Enable the offline Korean model below before speaking. It downloads once and then runs on this device.");
      return;
    }
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setMessage("This browser does not provide speech recognition. Type Hangul or romanization below.");
      return;
    }
    const speech = new Constructor();
    if (!localRecognitionReady) {
      setMessage("On-device Korean recognition is not available. Type Hangul or romanization instead.");
      return;
    }
    speech.lang = "ko-KR";
    speech.interimResults = true;
    speech.continuous = true;
    speech.maxAlternatives = 3;
    speech.processLocally = true;
    speech.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const value = result?.[0]?.transcript?.trim() ?? "";
        if (result?.isFinal) finalText += `${finalText ? " " : ""}${value}`;
        else interimText += `${interimText ? " " : ""}${value}`;
      }
      const heardText = [finalText, interimText].filter(Boolean).join(" ").trim();
      latestSpeechTranscript.current = heardText;
      setLiveTranscript(heardText);
      if (finalText.trim()) setMessage("I heard part of that. Keep speaking, then tap Stop when you’re done.");
      else if (interimText.trim()) setMessage("I’m hearing you… keep speaking, then tap Stop to finish.");
    };
    speech.onerror = (event) => {
      clearStopTimer();
      const partialText = latestSpeechTranscript.current.trim();
      recognition.current = null;
      stopRequested.current = false;
      setListeningState("ready");
      setLiveTranscript("");
      if (partialText && !handledSpeech.current) {
        handledSpeech.current = true;
        finish(partialText, "speech");
        return;
      }
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Allow microphone access for this site, or type your answer.",
        "audio-capture": "The browser could not read audio from the microphone. Check the selected input device and microphone permission.",
        "service-not-allowed": "On-device Korean recognition is unavailable. Install an offline Korean language pack, or type your answer.",
        "language-not-supported": "The Korean offline language pack is missing. Install it in the browser, or type your answer.",
        "no-speech": "No Korean speech was detected. Move closer to the microphone and try again, or type your answer.",
        network: "On-device recognition could not start. Check the Korean language pack, or type your answer.",
      };
      setMessage(messages[event.error ?? ""] ?? "Recognition stopped before a result arrived. Try again or type your answer.");
    };
    speech.onend = () => {
      clearStopTimer();
      const partialText = latestSpeechTranscript.current.trim();
      recognition.current = null;
      stopRequested.current = false;
      setListeningState("ready");
      setLiveTranscript("");
      if (partialText && !handledSpeech.current) {
        handledSpeech.current = true;
        finish(partialText, "speech");
        return;
      }
      setMessage((current) => {
        if (current === "Finishing recognition…" || current === "Listening for Korean…" || current === "I’m hearing you… keep speaking, then tap Stop to finish." || current === "I heard part of that. Keep speaking, then tap Stop when you’re done.") return "No Korean speech was detected. Move closer to the microphone and try again, or type your answer.";
        return current;
      });
    };
    recognition.current = speech;
    stopRequested.current = false;
    latestSpeechTranscript.current = "";
    handledSpeech.current = false;
    stopKoreanPlayback();
    setTranscript("");
    setLiveTranscript("");
    setListeningState("listening");
    setMessage("Listening for Korean…");
    stopTimer.current = window.setTimeout(() => stopListening(), 15_000);
    try { speech.start(); }
    catch {
      clearStopTimer();
      recognition.current = null;
      stopRequested.current = false;
      setListeningState("ready");
      setMessage("Could not start Korean recognition. Check microphone permission and browser speech settings, or type your answer.");
    }
  }

  const listening = listeningState !== "ready";
  const matches = transcript ? compareAnswer(transcript, expectedKorean, expectedRomanization) : false;

  return (
    <section className="speech-practice local-speech-practice" aria-label={heading} data-state={listening ? listeningState : "ready"}>
      <div className="local-speech-heading"><Microphone size={18} aria-hidden="true" /><h3>{heading}</h3></div>
      <p className="speech-practice-status" role="status" aria-live="polite">{message}</p>
      {liveTranscript && <p className="speech-live-transcript" lang="ko" aria-label="Live speech transcript">{liveTranscript}</p>}
      <div className="speech-mic-check" data-active={micTestState === "active" || listeningState === "listening"}>
        <SoriMascot className="speech-mic-mascot" />
        <div className="speech-mic-check-content">
          <div className="speech-input-meter" data-heard={micSignalDetected}>
        <div className="speech-input-meter-label"><span>Live microphone level</span><strong>{micTestState === "requesting" ? "Waiting for permission…" : micTestState === "blocked" ? "Microphone unavailable" : micTestState === "active" || listeningState === "listening" ? micSignalDetected ? "Sound reaching mic" : "Quiet · no sound yet" : listeningState === "transcribing" ? "Recording captured" : "Mic check is off"}</strong></div>
        <div className="speech-input-meter-track" role="meter" aria-label="Live microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}><span style={{ transform: `scaleX(${micLevel / 100})` }} /></div>
        <small>{micTestState === "active" || listeningState === "listening" ? micSignalDetected ? "Audio is reaching this browser. If no words appear, the issue is speech recognition rather than microphone access." : "Speak a few words. If this stays quiet, check the selected input and browser permission." : "Use mic check to confirm audio input before starting a speaking exercise. Audio is not recorded or sent by the check."}</small>
          </div>
          <button type="button" className="button button-quiet speech-mic-check-button" onClick={() => void toggleMicCheck()} disabled={micTestState === "requesting" || listeningState !== "ready"}>{micTestState === "requesting" ? "Connecting microphone…" : micTestState === "active" ? "Stop mic check" : "Check microphone"}</button>
        </div>
      </div>
      <div className="speech-practice-actions">
        <button type="button" className="button button-dark" onClick={listeningState === "listening" && !recognition.current ? stopLocalRecording : startListening} disabled={(!supported && !modelAvailable) || (!localRecognitionReady && !localModelReady) || listeningState === "stopping" || listeningState === "transcribing" || listeningState === "downloading"}>
          {listeningState === "listening" ? <><Stop size={16} /> Stop listening</> : listeningState === "stopping" ? "Finishing recording…" : listeningState === "transcribing" ? "Checking pronunciation…" : listeningState === "downloading" ? "Preparing offline speech…" : <><Microphone size={16} /> Speak Korean</>}
        </button>
        {canInstallPack && <button type="button" className="button button-quiet" onClick={() => void installLanguagePack()} disabled={installingPack}>{installingPack ? "Downloading Korean pack…" : "Download Korean offline pack"}</button>}
        {!localRecognitionReady && modelAvailable && !localModelReady && <button type="button" className="button button-quiet" onClick={enableOfflineModel} disabled={listeningState !== "ready"}>Enable offline Korean · ~50 MB</button>}
      </div>
      {modelProgress && <small className="local-speech-model-progress" aria-live="polite">{modelProgress}</small>}
      <form className="speech-typed" onSubmit={(event) => { event.preventDefault(); clearStopTimer(); recognition.current?.abort(); recognition.current = null; stopRequested.current = false; if (recorder.current?.state === "recording") { recorder.current.onstop = null; recorder.current.stop(); } stream.current?.getTracks().forEach((track) => track.stop()); stopMicrophoneMeter(); stream.current = null; recorder.current = null; audioChunks.current = []; setListeningState("ready"); setLiveTranscript(""); finish(typed); }}>
        <label>
          <span>Type Korean or romanization</span>
          <input lang="ko" value={typed} maxLength={240} autoComplete="off" placeholder="Hangul or romanized text" onChange={(event) => setTyped(event.target.value)} />
        </label>
        <button className="button button-quiet" type="submit" disabled={!typed.trim()}>
          Check phrase
        </button>
      </form>
      {transcript && <SpeechFeedback transcript={transcript} matches={matches} />}
      <small className="local-speech-privacy">Offline model files download once from Hugging Face after you choose Enable. Inference then runs in this browser; microphone audio and transcripts are never sent to Saegim or a speech provider. Feedback compares the recognized text with the target; it is an estimate, not phoneme-level pronunciation scoring. Model: <a href="https://huggingface.co/onnx-community/whisper-tiny" target="_blank" rel="noreferrer">Whisper tiny</a> (Apache 2.0 base model). Browser speech packs and typed answers are also available.</small>
      <OpenRouterListeningPractice korean={expectedKorean} english={expectedTranslation} />
    </section>
  );
}
