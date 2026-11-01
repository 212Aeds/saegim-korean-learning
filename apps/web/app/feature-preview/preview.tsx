"use client";
import {useEffect,useState,useRef} from "react";
import {SoriMascot} from "../ui/sori-mascot";
import {WordReference} from "../ui/word-reference";
import {recordedAudioUrl} from "../ui/recorded-audio";
import {lessons} from "../curriculum";
import {landingSamples} from "../landing-samples";
import {previewStorageKey,readPreviewPhrases,addPreviewPhrase,greetingLesson,introductionLesson,greeting,thanks,apology,closingPhrase,type SavedPhrase,type Branch} from "./model";
import styles from "./preview.module.css";
function PreviewClip({src,label}:{src:string;label:string}){
 const audioRef=useRef<HTMLAudioElement>(null);
 useEffect(()=>{const audio=audioRef.current;return()=>audio?.pause();},[src]);
 return <audio ref={audioRef} controls preload="none" src={src} aria-label={label} onPlay={event=>{const playing=event.currentTarget;playing.closest("main")?.querySelectorAll("audio").forEach(audio=>{if(audio!==playing)audio.pause();});}}/>;
}
export function FeaturePreview(){
 const [tab,setTab]=useState("conversation"),[step,setStep]=useState(0),[branch,setBranch]=useState<Branch>("introduce"),[notice,setNotice]=useState("");
 const [entries,setEntries]=useState<SavedPhrase[]>([]),[loaded,setLoaded]=useState(false),[storageNotice,setStorageNotice]=useState("");
 const [korean,setKorean]=useState(""),[meaning,setMeaning]=useState(""),[sampleIndex,setSampleIndex]=useState(0),[answer,setAnswer]=useState("");
 const [voice,setVoice]=useState<"chris"|"jessica">("jessica");
 useEffect(()=>{try{setEntries(readPreviewPhrases(localStorage.getItem(previewStorageKey)));}catch{setStorageNotice("Storage is unavailable. Your collection will last for this visit only.");}setLoaded(true);},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(previewStorageKey,JSON.stringify(entries));}catch{setStorageNotice("Storage is unavailable. Your collection will last for this visit only.");}},[entries,loaded]);
 const target=closingPhrase(branch),sample=landingSamples[sampleIndex],question=sample.question;
 function save(phrase:SavedPhrase){const result=addPreviewPhrase(entries,phrase);setEntries(result.items);setNotice(result.message);}
 function choose(correct:boolean){if(correct){setNotice("");setStep(current=>current+1);}else setNotice("Try another reply. Think about what the other person needs in this situation.");}
 function audio(text:string){const src=recordedAudioUrl(text,voice);return src?<PreviewClip key={src} src={src} label={`Hear ${text} with ${voice}`}/>:<small>No recorded clip for this preview entry.</small>;}
 return <main className={styles.lab}><header><SoriMascot thumbsUp/><div><span className="micro-label">TRY IT BEFORE WE SHIP IT</span><h1>A little learning playground.</h1><p>Three ideas to try. No account, AI requests, scores, or real progress changes.</p></div></header>
 <nav className={styles.tabs} aria-label="Preview features">{[["conversation","Mini-conversation"],["phrasebook","My phrasebook"],["why","Why this works"]].map(([id,label])=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setNotice("");}}>{label}</button>)}</nav>
 <section className={styles.panel} key={tab} aria-label={tab==="conversation"?"Conversation preview":tab==="phrasebook"?"Phrasebook preview":"Explanation preview"}>
 {tab==="conversation"&&<><span className="micro-label">A FRIENDLY FIRST MEETING · ABOUT 2 MINUTES</span><h2>Meet someone, then choose your next step.</h2><p>Prerequisites: read basic Hangul and practice Hello there. The introduction branch also uses Meet &amp; greet. This is a scripted role-play, not a fluency assessment.</p>
 <ol className={styles.thread} aria-label="Your conversation"><li><strong>Your partner</strong><p>You meet a relative’s friend. Start with a polite hello.</p></li>{step>0&&<li className={styles.you}><strong>You</strong><p lang="ko">{greeting.korean}</p></li>}{step>1&&<li><strong>Your partner</strong><p>{branch==="introduce"?"Tell me you are a student.":"I helped you find a seat. What would you say?"}</p></li>}{step>2&&<li className={styles.you}><strong>You</strong><p lang="ko">{target.korean}</p><span>{target.meaning}</span></li>}</ol>
 {step===0&&<div className={styles.choices}>{[greeting,thanks,apology].map(item=><button type="button" key={item.id} lang="ko" onClick={()=>choose(item.id===greeting.id)}>{item.korean}</button>)}</div>}
 {step===1&&<><h3>What would you like to say next?</h3><div className={styles.choices}><button type="button" onClick={()=>{setBranch("introduce");setStep(2);}}>Introduce myself</button><button type="button" onClick={()=>{setBranch("thank");setStep(2);}}>Thank them for helping</button></div></>}
 {step===2&&<div className={styles.choices}>{[target.korean,apology.korean].map(text=><button type="button" lang="ko" key={text} onClick={()=>choose(text===target.korean)}>{text}</button>)}</div>}
 {step===3&&<div className={styles.finish}><SoriMascot thumbsUp/><h3>A small conversation, completed.</h3><p>You chose a greeting and a useful response. This is a good place to stop.</p>{audio(target.korean)}<div className={styles.choices}><button type="button" onClick={()=>save(target)}>Save this phrase</button><button type="button" onClick={()=>{setStep(0);setNotice("");}}>Try the other path</button><button type="button" onClick={()=>{setTab("phrasebook");setNotice("");}}>Finish and see my phrases</button></div></div>}
 <details><summary>Why these replies?</summary><p>{greeting.tip}</p><p>{branch==="introduce"?introductionLesson.briefing?.explanation:thanks.tip}</p><WordReference word={greeting.korean}/><WordReference word={step>1?target.korean:thanks.korean}/></details></>}
 {tab==="phrasebook"&&<><span className="micro-label">YOUR WORDS, YOUR REASONS</span><h2>Something I want to say.</h2><p>Save a phrase for family, a trip, or everyday life. Preview entries stay in this browser, separate from your real progress. Clearing site data can remove them. Personal entries are not automatically translated or checked.</p>
 <form className={styles.form} onSubmit={event=>{event.preventDefault();save({korean,meaning});}}><label>Korean phrase<input value={korean} onChange={event=>setKorean(event.target.value)} maxLength={120} lang="ko" placeholder="안녕하세요" required/></label><label>Meaning or personal note<input value={meaning} onChange={event=>setMeaning(event.target.value)} maxLength={180} placeholder="Hello — something to say to family" required/></label><button type="submit">Save my phrase</button></form>
 <label>Recorded voice<select value={voice} onChange={event=>setVoice(event.target.value as "chris"|"jessica")}><option value="jessica">Jessica</option><option value="chris">Chris</option></select></label>
 {entries.length===0?<p className={styles.empty}>Your collection starts with one useful phrase. Save one from the conversation, or add your own.</p>:<ul className={styles.saved}>{entries.map(entry=><li key={entry.korean}><strong lang="ko">{entry.korean}</strong><p>{entry.meaning}</p>{audio(entry.korean)}<WordReference word={entry.korean}/></li>)}</ul>}</>}
 {tab==="why"&&<><span className="micro-label">UNDERSTAND IT, THEN TRY IT</span><h2>A reason behind the answer.</h2><div className={styles.choices}>{landingSamples.map((item,index)=><button type="button" key={item.lessonId} aria-pressed={index===sampleIndex} onClick={()=>{setSampleIndex(index);setAnswer("");}}>{item.label}</button>)}</div><p className={styles.korean} lang="ko">{question.korean}</p><h3>{question.prompt}</h3><div className={styles.choices}>{question.choices.map(choice=><button type="button" key={choice} aria-pressed={answer===choice} onClick={()=>setAnswer(choice)}>{choice}</button>)}</div>
 {answer&&<div className={styles.explanation} role="status"><strong>{answer===question.answer?"That fits.":"Compare the pattern."}</strong><p>{question.tip}</p><p><strong>Standard answer:</strong> {question.answer}</p><details open><summary>Why is this correct?</summary><p>{lessons.find(lesson=>lesson.id===sample.lessonId)?.briefing?.watchFor ?? question.tip}</p><p>Compare this with the other choices: which situation or rule does each choice describe?</p></details><button type="button" onClick={()=>{setSampleIndex((sampleIndex+1)%landingSamples.length);setAnswer("");}}>Try a different example</button></div>}
 <WordReference word={question.korean}/></>}
 {notice&&<p role="status" className={styles.notice}>{notice}</p>}{storageNotice&&<p role="status">{storageNotice}</p>}
 </section><footer><p>Tell me which idea feels useful, confusing, or unnecessary. Nothing here awards streaks or pushes you into another round.</p><a href="/">Back to Saegim</a></footer></main>;
}
