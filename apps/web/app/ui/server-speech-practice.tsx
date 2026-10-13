"use client";
import { useEffect, useRef, useState } from "react";
import { localSpeechAvailable, transcribeOnLocalServer } from "./local-speech-server";
import { playKorean, stopKoreanPlayback } from "./speech";
import { compareSpeech } from "./speech-check";
import { transcriptRomanization } from "./transcript-romanization";
import { KoreanInput } from "./korean-keyboard";
import { SoriMascot } from "./sori-mascot";

type Capture = { recorder: MediaRecorder; stream: MediaStream; context: AudioContext; frame: number; timer: number };
export function ServerSpeechPractice({ korean, expectedRomanization, onResult }: {
  korean: string; expectedRomanization?: string; onResult?: (text: string, matches: boolean) => void;
}) {
  const [ready,setReady]=useState(false);
  const [state,setState]=useState<"ready"|"starting"|"listening"|"checking"|"playing">("ready");
  const [notice,setNotice]=useState("Connecting to your local speech server…");
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
    void localSpeechAvailable().then(available=>{if(alive){setReady(available);setNotice(available?"Ready. Say the phrase; a pause finishes the recording.":"The local speech server is unavailable. Start it and reopen this section, or type your answer.");}});
    return ()=>{alive=false;version.current++;controller.current?.abort();if(capture.current){capture.current.recorder.onstop=null;if(capture.current.recorder.state==="recording")capture.current.recorder.stop();}release();stopKoreanPlayback();};
  },[]);
  function check(text: string) {
    const answer=text.trim(); if(!answer)return;
    const romanized=expectedRomanization?.toLowerCase().replace(/[^a-z]/g,"");
    const correct=compareSpeech(korean,answer,true).matches || Boolean(romanized && answer.toLowerCase().replace(/[^a-z]/g,"")===romanized);
    setHeard(answer);setMatch(correct);onResult?.(answer,correct);
    setNotice(correct?"Nice work! That matches the target wording.":"Try again. Compare what was heard with the target; recognition can make mistakes.");
  }
  function stop() {
    const current=capture.current;
    if(current?.recorder.state==="recording"){setState("checking");current.recorder.stop();}
  }
  async function start() {
    if(!ready||state!=="ready")return;
    const attempt=++version.current;setState("starting");setMatch(null);stopKoreanPlayback();
    let stream: MediaStream|undefined, context: AudioContext|undefined;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      if(attempt!==version.current){stream.getTracks().forEach(track=>track.stop());return;}
      context=new AudioContext();await context.resume();
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
        }catch{if(attempt===version.current)setNotice("Local transcription failed. Try again or type your answer; no paid service was used.");}
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
        if(rms>=0.004){sound=true;lastSound=now;}else if(sound&&now-lastSound>1800){stop();return;}
        current.frame=requestAnimationFrame(tick);
      };current.frame=requestAnimationFrame(tick);
    }catch{stream?.getTracks().forEach(track=>track.stop());if(context&&context.state!=="closed")void context.close();if(attempt===version.current){setState("ready");setNotice("Microphone access is unavailable. Allow access or type your answer.");}}
  }
  return <section className="speech-practice" aria-label="Korean speech practice">
    <h3>Listen, then try saying it</h3>
    <p role="status">{notice}</p>
    {match!==null&&<SoriMascot className="speech-feedback-mascot" thumbsUp={match} />}
    <div className="speech-practice-actions">
      <button type="button" className="button button-soft" disabled={state!=="ready"} onClick={async()=>{setState("playing");try{const result=await playKorean(korean,{waitForEnd:true});if(!result.played)setNotice("Korean audio is unavailable. You can still type your answer.");}finally{setState("ready");}}}>Listen to Korean</button>
      <button type="button" className="button button-dark" disabled={!ready||(state!=="ready"&&state!=="listening")} onClick={state==="listening"?stop:()=>void start()}>{state==="listening"?"Stop recording":state==="checking"?"Checking…":"Speak Korean"}</button>
    </div>
    {state==="listening"&&<meter min={0} max={100} value={level} aria-label="Microphone input level" />}
    <form onSubmit={event=>{event.preventDefault();check(written);}}>
      <KoreanInput value={written} onChange={setWritten} label="Type Korean or romanization" maxLength={240} openOnFocus={false}/>
      <button className="button button-quiet" disabled={!written.trim()||state!=="ready"}>Check phrase</button>
    </form>
    {heard&&<div className="speech-transcript"><p lang="ko">{heard}</p><small>{transcriptRomanization(heard)}</small><strong>{match?"Match":"Try again"}</strong></div>}
    <small>Recording is sent to the local server you configured. No paid speech service is used. Feedback compares recognized text, not individual pronunciation sounds.</small>
  </section>;
}
