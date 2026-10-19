"use client";
import { useEffect, useRef, useState } from "react";
import { localSpeechAvailable, transcribeOnLocalServer } from "./local-speech-server";
import { playElevenLabsKorean, preferredSpeechRate, selectedElevenLabsVoice, saveSpeechRate, saveElevenLabsVoice, prefetchLocalKorean, stopKoreanPlayback, type ElevenLabsVoice } from "./speech";
import { playCorrectAnswerSound, unlockPracticeSounds } from "./feedback-sound";
import { preferredRecordingPause, saveRecordingPause } from "./recording-preferences";
import { recordConversationTurn } from "./conversation-recording";
import { ListeningControls } from "./listening-controls";
import { matchesPracticeAnswer } from "./speech-check";
import { SpeechFeedback } from "./speech-feedback";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { Microphone, SpeakerHigh, Stop } from "./icons";

type PracticeState = "ready" | "starting" | "listening" | "checking" | "playing";
function microphoneMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (["NotAllowedError","PermissionDeniedError"].includes(error.name)) return "Microphone access is blocked. Allow it in your browser’s site settings, then try again. You can also write your answer.";
    if (error.name === "NotFoundError") return "No microphone was found. Connect one, or write your answer.";
    if (error.name === "NotReadableError") return "Your microphone is busy or unavailable. Close other apps using it, then try again.";
  }
  return error instanceof Error && error.message ? error.message : "Couldn’t hear that clearly. Try again or write your answer.";
}
export function ServerSpeechPractice({ korean, expectedRomanization, onResult, selectedVoice, selectedPace, onVoiceChange, onPaceChange, variant }: {
  korean: string; expectedRomanization?: string; onResult?: (text: string, matches: boolean) => void;
  selectedVoice?: ElevenLabsVoice; onVoiceChange?: (voice: ElevenLabsVoice) => void; onPaceChange?: (pace: number) => void;
  selectedPace?: number; variant?: "combined" | "lesson-speaking";
}) {
  const [voice,setVoice]=useState<ElevenLabsVoice>("jessica"), [pace,setPace]=useState(1);
  const [ready,setReady]=useState(false), [connecting,setConnecting]=useState(true);
  const [pauseMs,setPauseMs]=useState(3000);
  const [pauseRemaining,setPauseRemaining]=useState<number|null>(null);
  const [state,setState]=useState<PracticeState>("ready");
  const [notice,setNotice]=useState("Getting speech practice ready. You can listen or write while you wait.");
  const [written,setWritten]=useState(""), [heard,setHeard]=useState("");
  const [match,setMatch]=useState<boolean|null>(null), [level,setLevel]=useState(0), [seconds,setSeconds]=useState(0);
  const version=useRef(0), busy=useRef(false), mounted=useRef(true);
  const controller=useRef<AbortController|null>(null), finish=useRef<(()=>void)|null>(null);
  const active=state!=="ready";
  useEffect(()=>setPauseMs(preferredRecordingPause()),[]);
  useEffect(()=>{setVoice(selectedVoice ?? selectedElevenLabsVoice());setPace(selectedPace ?? preferredSpeechRate());},[selectedVoice,selectedPace]);
  useEffect(()=>{void prefetchLocalKorean(korean,voice);},[korean,voice]);
  function cancel(message="Attempt canceled. Ready when you are.") {
    version.current++; controller.current?.abort(); controller.current=null; finish.current=null; busy.current=false;
    stopKoreanPlayback();setState("ready");setLevel(0);setSeconds(0);setPauseRemaining(null);setNotice(message);
  }
  useEffect(()=>{
    mounted.current=true;
    let alive=true;
    void localSpeechAvailable().then(available=>{if(alive){setReady(available);setConnecting(false);setNotice(available?"Listen once, then tap Speak. A short pause finishes your recording.":"Speech practice is unavailable right now. Retry the connection, or write your answer.");}});
    return ()=>{alive=false;mounted.current=false;version.current++;controller.current?.abort();stopKoreanPlayback();};
  },[]);
  useEffect(()=>{
    setNotice("Listen once, then tap Speak. A short pause finishes your recording.");
    setWritten("");setHeard("");setMatch(null);setLevel(0);setSeconds(0);setState("ready");busy.current=false;
    return ()=>{version.current++;controller.current?.abort();finish.current=null;stopKoreanPlayback();};
  },[korean]);
  useEffect(()=>{
    const hide=()=>{if(document.hidden && busy.current)cancel("Practice paused when you left the page. Tap Speak when you’re ready.");};
    document.addEventListener("visibilitychange",hide);
    return ()=>document.removeEventListener("visibilitychange",hide);
  },[]);
  useEffect(()=>{
    if(state!=="listening")return;
    setSeconds(0);const started=Date.now();
    const timer=window.setInterval(()=>setSeconds(Math.min(30,Math.floor((Date.now()-started)/1000))),250);
    return ()=>window.clearInterval(timer);
  },[state]);
  async function reconnect() {
    setConnecting(true);
    const available=await localSpeechAvailable();
    if(!mounted.current)return;
    setReady(available);setConnecting(false);setNotice(available?"Ready. Tap Speak when you’re ready.":"Speech practice is unavailable. You can still listen or write your answer.");
  }
  function check(text:string) {
    const answer=text.trim();if(!answer)return;
    const correct=matchesPracticeAnswer(korean,answer,expectedRomanization);
    setHeard(answer);setMatch(correct);onResult?.(answer,correct);if(correct&&!onResult)playCorrectAnswerSound();
    setNotice(correct?"Nice work! That matches the target wording.":"Try again. Compare the transcript with the target. Recognition can make mistakes; this checks wording, not pronunciation quality.");
  }
  async function listen() {
    if(busy.current)return;
    busy.current=true;const attempt=++version.current;setState("playing");setNotice("Preparing Korean audio…");
    try {const result=await playElevenLabsKorean(korean,voice,pace,{waitForEnd:true,consistentVoice:true,naturalOnly:true});
      if(attempt===version.current)setNotice(result.played?"Your turn. Tap Speak, then say the phrase.":"Audio could not start. Tap Listen to try again, or write your answer.");
    }catch{if(attempt===version.current)setNotice("Audio could not start. Try again or write your answer.");}
    finally{if(attempt===version.current){busy.current=false;setState("ready");}}
  }
  async function start() {
    if(!ready||busy.current)return;
    unlockPracticeSounds();
    busy.current=true;const attempt=++version.current, current=new AbortController();controller.current=current;
    setState("starting");setNotice("Allow microphone access if your browser asks. Wait for Listening before speaking.");setMatch(null);setHeard("");setLevel(0);stopKoreanPlayback();
    let wav:ArrayBuffer|undefined;
    try {
      wav=await recordConversationTurn(current.signal,value=>{if(attempt===version.current)setLevel(value);},{silenceMs:pauseMs,onSilence:remaining=>{if(attempt===version.current)setPauseRemaining(remaining);},onCalibrating:()=>{if(attempt===version.current)setNotice("Adjusting to background noise… Wait for Listening, then speak.");},onReady:stop=>{
        if(attempt!==version.current)return;
        finish.current=stop;
        if(stop){setState("listening");setNotice("Listening. Say the phrase, then pause—or tap Stop & check.");}
      }});
      if(current.signal.aborted||attempt!==version.current)return;
      finish.current=null;setState("checking");setLevel(0);setNotice("Checking your Korean… You can cancel while you wait.");
      const text=await transcribeOnLocalServer(new Blob([wav],{type:"audio/wav"}),current.signal);
      if(attempt!==version.current||current.signal.aborted)return;
      if(text.trim())check(text);else setNotice("No words were detected. Try again closer to your microphone, or write your answer.");
    }catch(error){if(attempt===version.current && !current.signal.aborted)setNotice(microphoneMessage(error));}
    finally{if(wav)new Uint8Array(wav).fill(0);if(attempt===version.current){controller.current=null;finish.current=null;busy.current=false;setState("ready");setLevel(0);}}
  }
  return <section className="speech-practice speaking-studio" aria-label="Korean speech practice" data-state={state}>
    <div className="speaking-studio-heading"><span className="micro-label">YOUR TURN TO SPEAK</span><h3>One phrase. A little more confidence.</h3></div>
    <p className="speech-practice-status" role="status" aria-live="polite">{notice}</p>
    {variant!=="lesson-speaking" && <ListeningControls voice={voice} pace={pace} disabled={active} onVoiceChange={value=>{setVoice(value);saveElevenLabsVoice(value);onVoiceChange?.(value);}} onPaceChange={value=>{setPace(value);saveSpeechRate(value);onPaceChange?.(value);}} />}
    <div className="speaking-mic-panel" data-active={state==="listening"}>
      <div className="speech-input-meter-label"><span>{state==="listening"?pauseRemaining!==null?`Pause · checking in ${(pauseRemaining/1000).toFixed(1)}s`:level>=3?"Sound reaching your mic":seconds<2?"Listening · speak naturally":"Listening for your voice · try moving closer":state==="starting"?"Opening microphone…":state==="checking"?"Recording finished · checking wording":"Microphone off"}</span>{state==="listening" && <strong>{seconds}s / 30s</strong>}</div>
      <meter min={0} max={100} value={level} aria-label="Microphone input level" />
      <div className="speech-practice-actions">
        {variant!=="lesson-speaking" && <button type="button" className="button button-soft" disabled={active} onClick={()=>void listen()}><SpeakerHigh size={18}/>{state==="playing"?"Playing Korean…":"Listen"}</button>}
        <button type="button" className="button button-dark" disabled={!ready||(active&&state!=="listening")} onClick={state==="listening"?()=>finish.current?.():()=>void start()}>{state==="listening"?<Stop size={18}/>:<Microphone size={18}/>} {state==="listening"?"Stop & check":state==="starting"?"Opening mic…":state==="checking"?"Checking…":heard?"Try speaking again":"Speak Korean"}</button>
        {active && <button type="button" className="button button-quiet" onClick={()=>cancel()}>{state==="playing"?"Stop audio":"Cancel"}</button>}
      </div>
      {!ready && <button type="button" className="button button-quiet" disabled={connecting||active} onClick={()=>void reconnect()}>{connecting?"Connecting speech…":"Retry speech connection"}</button>}
      <label className="speech-pause-control">Pause before checking<select aria-label="Pause before checking" value={pauseMs} disabled={active} onChange={event=>{const value=Number(event.target.value);setPauseMs(value);saveRecordingPause(value);}}><option value={3000}>3 seconds · natural pace</option><option value={5000}>5 seconds · take a breath</option><option value={10000}>10 seconds · unhurried</option></select><small>Your pause starts after your last words. Keep speaking to extend it, or tap Stop &amp; check to send now.</small></label>
      <details className="microphone-help"><summary>No sound? Check your microphone</summary><p>Allow microphone access in this browser’s site settings. If headphones are connected, check which microphone your phone or computer is using. Disconnect Bluetooth to try your device’s own microphone, then tap Speak again.</p></details>
    </div>
    {heard && match!==null && <SpeechFeedback transcript={heard} matches={match}/>}
    <details className="speaking-write"><summary>Prefer to write? Try Korean or romanization</summary><form onSubmit={event=>{event.preventDefault();if(!busy.current)check(written);}}>
      <KoreanInput value={written} onChange={setWritten} label="Type Korean or romanization" placeholder="Type Korean or romanization…" maxLength={240} openOnFocus={false}/>
      <button className="button button-soft" disabled={!written.trim()||active}>Check phrase</button>
    </form></details>
    {variant!=="lesson-speaking" && <WordReference word={korean}/>}
  </section>;
}
