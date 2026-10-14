"use client";
import {useEffect,useRef,useState} from "react";
import type {PublicGuide} from "../public-guides";
import {playElevenLabsKorean,stopKoreanPlayback,type ElevenLabsVoice} from "./speech";
import {transcriptRomanization} from "./transcript-romanization";
import {WordReference} from "./word-reference";
import {SoriMascot} from "./sori-mascot";
export function GuidePractice({guide}:{guide:PublicGuide}){
 const [voice,setVoice]=useState<ElevenLabsVoice>("jessica"),[pace,setPace]=useState(1),[playing,setPlaying]=useState<string|null>(null),[notice,setNotice]=useState("");
 const [answer,setAnswer]=useState(""),[checked,setChecked]=useState(false);const attempt=useRef(0);
 useEffect(()=>()=>{attempt.current++;stopKoreanPlayback();},[]);
 async function listen(text:string){const turn=++attempt.current;setPlaying(text);setNotice("");try{const result=await playElevenLabsKorean(text,voice,pace,{naturalOnly:true,waitForEnd:true});if(turn===attempt.current&&!result.played)setNotice("Audio could not play. Please try again.");}finally{if(turn===attempt.current)setPlaying(null);}}
 const correct=answer===guide.check.answer;
 return <section className="guide-practice" aria-label="Try this Korean">
 <span className="micro-label">LISTEN. NOTICE. TRY.</span><h2>Make it a little more familiar.</h2>
 <div className="guide-audio-controls"><label>Korean voice<select disabled={!!playing} value={voice} onChange={e=>setVoice(e.target.value as ElevenLabsVoice)}><option value="jessica">Jessica</option><option value="chris">Chris</option></select></label><label>Listening pace <strong>{pace.toFixed(2)}×</strong><input aria-label="Guide listening pace" type="range" min="0.65" max="1.4" step="0.05" value={pace} disabled={!!playing} onChange={e=>setPace(Number(e.target.value))}/></label>{playing&&<button className="button button-quiet" onClick={()=>{attempt.current++;stopKoreanPlayback();setPlaying(null);}}>Stop audio</button>}</div>
 <ul className="guide-samples">{guide.samples.map(sample=><li key={sample.korean}><div><strong lang="ko">{sample.korean}</strong><span>{sample.romanization??transcriptRomanization(sample.korean)}</span><p>{sample.meaning}</p></div><button className="button button-soft" disabled={!!playing} onClick={()=>void listen(sample.korean)} aria-label={`Listen to ${sample.korean}`}>{playing===sample.korean?"Playing…":"Listen"}</button><WordReference word={sample.korean} readingSample={sample.readingSample}/></li>)}</ul>
 {notice&&<p role="status">{notice}</p>}
 <div className="guide-quick-check"><span className="micro-label">A LITTLE RECALL</span><h3>{guide.check.prompt}</h3><div className="guide-check-choices" role="group" aria-label="Quick check answers">{guide.check.choices.map(choice=><button className={`choice ${answer===choice?"chosen":""}`} aria-pressed={answer===choice} key={choice} lang="ko" onClick={()=>{setAnswer(choice);setChecked(false);}}>{choice}</button>)}</div><button className="button button-dark" disabled={!answer} onClick={()=>setChecked(true)}>Check answer</button>{checked&&<div className="guide-check-feedback" role="status">{correct&&<SoriMascot thumbsUp/>}<p><strong>{correct?"잘했어요! Nice work.":"Have another look."}</strong> {guide.check.explanation}</p></div>}<small>This preview does not change your lesson progress.</small></div>
 </section>;
}
