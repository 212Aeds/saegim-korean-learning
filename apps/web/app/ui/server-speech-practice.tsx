"use client";
import { useEffect, useRef, useState } from "react";
import { localSpeechAvailable, transcribeOnLocalServer } from "./local-speech-server";
import { playElevenLabsKorean, preferredSpeechRate, selectedElevenLabsVoice, saveSpeechRate, saveElevenLabsVoice, prefetchLocalKorean, stopKoreanPlayback, type ElevenLabsVoice } from "./speech";
import { ListeningControls } from "./listening-controls";
import { matchesPracticeAnswer } from "./speech-check";
import { SpeechFeedback } from "./speech-feedback";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";

type Capture = { recorder: MediaRecorder; stream: MediaStream; context: AudioContext; frame: number; timer: number };
export function ServerSpeechPractice({ korean, expectedRomanization, onResult, selectedVoice, selectedPace, onVoiceChange, onPaceChange, variant }: {
  korean: string; expectedRomanization?: string; onResult?: (text: string, matches: boolean) => void;
  selectedVoice?: ElevenLabsVoice; onVoiceChange?: (voice: ElevenLabsVoice) => void; onPaceChange?: (pace: number) => void;
  selectedPace?: number;
  variant?: "combined" | "lesson-speaking";
}) {
  const [voice,setVoice]=useState<ElevenLabsVoice>("jessica"), [pace,setPace]=useState(1);
  useEffect(()=>{setVoice(selectedVoice ?? selectedElevenLabsVoice());setPace(selectedPace ?? preferredSpeechRate());},[selectedVoice,selectedPace]);
  useEffect(()=>{void prefetchLocalKorean(korean,voice);},[korean,voice]);
  const [ready,setReady]=useState(false);
  const [state,setState]=useState<"ready"|"starting"|"listening"|"checking"|"playing">("ready");
  const [notice,setNotice]=useState("Getting speech practice ready…");
  const [written,setWritten]=useState("");
  const [heard,setHeard]=useState("");
  const [match,setMatch]=useState<boolean|null>(null);
  const [level,setLevel]=useState(0);
  const capture=useRef<Capture|null>(null);
  const version=useRef(0);
  const controller=useRef<AbortController|null>(null);

  function release() {
    const current=capture.current; capture.current=null;
    if (!current) return;
    clearTimeout(current.timer); cancelAnimationFrame(current.frame);
    current.stream.getTracks().forEach(track=>track.stop());
    void current.context.close();
  }
  useEffect(()=>{
    let alive=true;
    void localSpeechAvailable().then(available=>{if(alive){setReady(available);setNotice(available?"Ready. Say the phrase; a pause finishes the recording.":"Speech practice is unavailable right now. Try again shortly or write your answer.");}});
    return ()=>{alive=false;version.current++;controller.current?.abort();if(capture.current){capture.current.recorder.onstop=null;if(capture.current.recorder.state==="recording")capture.current.recorder.stop();}release();stopKoreanPlayback();};
  },[]);
  async function reconnect() {
    const attempt=++version.current;setState("checking");setNotice("Connecting to speech practice…");
    const available=await localSpeechAvailable();
    if(attempt!==version.current)return;
    setReady(available);setState("ready");setNotice(available?"Ready. Say the phrase; a pause finishes the recording.":"Speech practice is unavailable. You can still write your answer.");
  }
  function check(text: string) {
    const answer=text.trim(); if(!answer)return;
    const correct=matchesPracticeAnswer(korean,answer,expectedRomanization);
    setHeard(answer);setMatch(correct);onResult?.(answer,correct);
    setNotice(correct?"Nice work! That matches the target wording.":"Try again. Compare what was heard with the target; recognition can make mistakes.");
  }
  function stop() {
    const current=capture.current;
    if(current?.recorder.state==="recording"){setState("checking");current.recorder.stop();}
  }
  async function listen() {
    const attempt=++version.current;
    setState("playing");setNotice("Preparing Korean audio…");
    try {
      const result=await playElevenLabsKorean(korean,voice,pace,{waitForEnd:true,naturalOnly:true});
      if(attempt===version.current)setNotice(result.played?"Your turn. Try saying the phrase.":"Korean audio is unavailable. You can still type your answer.");
    } catch { if(attempt===version.current)setNotice("Audio could not start. Please try again or type your answer."); } finally { if(attempt===version.current)setState("ready"); }
  }
  async function start() {
    if(!ready||state!=="ready")return;
    const attempt=++version.current;setState("starting");setMatch(null);stopKoreanPlayback();
    let stream: MediaStream|undefined, context: AudioContext|undefined;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      if(attempt!==version.current){stream.getTracks().forEach(track=>track.stop());return;}
      context=new AudioContext();await context.resume();
      if(attempt!==version.current){stream.getTracks().forEach(track=>track.stop());void context.close();return;}
      const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();
      analyser.fftSize=1024;source.connect(analyser);
      const preferred=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(type=>MediaRecorder.isTypeSupported(type));
      const recorder=new MediaRecorder(stream,preferred?{mimeType:preferred}:undefined),chunks:Blob[]=[];
      const current:Capture={recorder,stream,context,frame:0,timer:0};capture.current=current;
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=async()=>{
        release();setLevel(0);setState("checking");setNotice("Checking your Korean…");
        controller.current=new AbortController();
        try {const text=await transcribeOnLocalServer(new Blob(chunks,{type:recorder.mimeType}),controller.current.signal);
          if(attempt!==version.current)return;
          if(text.trim())check(text);else setNotice("No speech was detected. Try again or type your answer.");
        }catch{if(attempt===version.current)setNotice("Couldn’t hear that clearly. Try again or write your answer.");}
        finally{if(attempt===version.current)setState("ready");}
      };
      recorder.onerror=()=>{recorder.onstop=null;release();setState("ready");setNotice("Recording failed. Check your microphone permission or type your answer.");};
      recorder.start();setState("listening");setNotice("Listening… pause when you finish.");
      current.timer=window.setTimeout(stop,12000);
      const samples=new Float32Array(analyser.fftSize);let sound=false,lastSound=performance.now();
      const tick=(now:number)=>{
        if(capture.current!==current||recorder.state!=="recording")return;
        analyser.getFloatTimeDomainData(samples);let sum=0;for(const value of samples)sum+=value*value;
        const rms=Math.sqrt(sum/samples.length);setLevel(Math.min(100,Math.round(rms*2200)));
        if(rms>=0.004){sound=true;lastSound=now;}else if(sound&&now-lastSound>1100){stop();return;}
        current.frame=requestAnimationFrame(tick);
      };current.frame=requestAnimationFrame(tick);
    }catch{stream?.getTracks().forEach(track=>track.stop());if(context&&context.state!=="closed")void context.close();if(attempt===version.current){setState("ready");setNotice("Microphone access is unavailable. Allow access or type your answer.");}}
  }
  return <section className="speech-practice" aria-label="Korean speech practice">
    <h3>Listen, then try saying it</h3>
    <p role="status">{notice}</p>
    {!ready && <button type="button" className="button button-quiet" disabled={state!=="ready"} onClick={()=>void reconnect()}>Retry speech connection</button>}
    {variant !== "lesson-speaking" && <ListeningControls voice={voice} pace={pace} disabled={state!=="ready"} onVoiceChange={value=>{setVoice(value);saveElevenLabsVoice(value);onVoiceChange?.(value);}} onPaceChange={value=>{setPace(value);saveSpeechRate(value);onPaceChange?.(value);}} />}
    <div className="speech-practice-actions">
      <button type="button" className="button button-soft" disabled={state!=="ready"} onClick={()=>void listen()}>{state==="playing"?"Playing Korean…":"Listen to Korean"}</button>
      {state==="playing"&&<button type="button" className="button button-quiet" onClick={()=>{version.current++;stopKoreanPlayback();setState("ready");setNotice("Audio stopped. Ready when you are.");}}>Stop audio</button>}
      <button type="button" className="button button-dark" disabled={!ready||(state!=="ready"&&state!=="listening")} onClick={state==="listening"?stop:()=>void start()}>{state==="listening"?"Stop recording":state==="checking"?"Checking…":"Speak Korean"}</button>
    </div>
    {state==="listening"&&<meter min={0} max={100} value={level} aria-label="Microphone input level" />}
    <form onSubmit={event=>{event.preventDefault();check(written);}}>
      <span className="speech-written-label">Or write your answer</span>
      <KoreanInput value={written} onChange={setWritten} label="Type Korean or romanization" placeholder="Type Korean or romanization…" maxLength={240} openOnFocus={false}/>
      <button className="button button-quiet" disabled={!written.trim()||state!=="ready"}>Check phrase</button>
    </form>
    {heard && match!==null && <SpeechFeedback transcript={heard} matches={match} />}
    {variant !== "lesson-speaking" && <WordReference word={korean} />}
  </section>;
}
