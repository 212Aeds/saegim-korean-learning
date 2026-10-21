"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import type {LearningProfile} from "../learning-profile";
import type {LearningPreferences} from "../progress";
import {eligibleHangulBlocks,composeHangulBlock} from "./hangul-blocks";
import {KoreanInput} from "./korean-keyboard";
import {WordReference} from "./word-reference";
import {SoriMascot} from "./sori-mascot";
import {recordedAudioUrl} from "./recorded-audio";
import {stopKoreanPlayback} from "./speech";
import {playCorrectAnswerSound} from "./feedback-sound";
import styles from "./hangul-block-builder.module.css";
export function HangulBlockBuilder({completed,profile,preferences,initialMode="tiles",onClose,onComplete}:{completed:string[];profile:LearningProfile;preferences:LearningPreferences;initialMode?:"tiles"|"writing";onClose:()=>void;onComplete:()=>void}){
 const samples=useMemo(()=>eligibleHangulBlocks(completed,profile).slice(0,5),[completed,profile]);
 const [index,setIndex]=useState(0),[mode,setMode]=useState(initialMode),[consonant,setConsonant]=useState(""),[vowel,setVowel]=useState(""),[written,setWritten]=useState(""),[checked,setChecked]=useState(false);
 const done=useRef(false),audio=useRef<HTMLAudioElement>(null),sample=samples[index];
 const block=mode==="tiles"?composeHangulBlock(consonant,vowel):written.normalize("NFC").trim();
 const correct=Boolean(sample&&block===sample.korean);
 const consonants=[...new Set(samples.map(item=>item.letters[0]))],vowels=[...new Set(samples.map(item=>item.letters[1]))];
 useEffect(()=>{stopKoreanPlayback();const element=audio.current;return()=>element?.pause();},[index,mode]);
 useEffect(()=>{if(index>=samples.length&&!done.current){done.current=true;onComplete();}},[index,samples.length,onComplete]);
 function resetAnswer(){setConsonant("");setVowel("");setWritten("");setChecked(false);}
 function check(){if(!block)return;setChecked(true);if(correct)playCorrectAnswerSound();}
 if(!sample)return <section className={styles.panel} aria-label="Hangul block practice complete"><SoriMascot thumbsUp className={styles.mascot}/><h2>A little building, completed.</h2><p>You practiced {samples.length} familiar {samples.length===1?"block":"blocks"}. That is a good place to stop. This records practice, not lesson completion or mastery.</p><button type="button" className="button button-dark" onClick={onClose}>Back to practice</button></section>;
 const clip=recordedAudioUrl(sample.korean,preferences.speechVoice);
 return <section className={styles.panel} aria-label="Build and write Hangul"><span className="micro-label">LETTERS INTO ONE BLOCK · {index+1} OF {samples.length}</span><h2>Build a Hangul block.</h2><p>A consonant and a vowel fit together in one square. Start with the letters shown below. This reading sample is not a word definition.</p><p>New learners start with ㄱ + ㅏ. More combinations open as you learn the letters; your chosen starting level also guides practice.</p>
 <div className={styles.modes} role="group" aria-label="Hangul practice method"><button type="button" aria-pressed={mode==="tiles"} onClick={()=>{setMode("tiles");resetAnswer();}}>Build with tiles</button><button type="button" aria-pressed={mode==="writing"} onClick={()=>{setMode("writing");resetAnswer();}}>Write with a keyboard</button></div>
 <h3>Combine <span lang="ko">{sample.letters.join(" + ")}</span></h3>
 {mode==="tiles"?<><div className={styles.slots} aria-label="Your assembled syllable"><span lang="ko">{consonant||"?"}</span><span>+</span><span lang="ko">{vowel||"?"}</span><span>→</span><strong lang="ko">{block||"□"}</strong></div><div className={styles.letters}><fieldset><legend>Consonant</legend>{consonants.map(letter=><button type="button" key={letter} aria-label={`Choose consonant ${letter}`} aria-pressed={consonant===letter} disabled={checked&&correct} onClick={()=>{setConsonant(letter);setChecked(false);}}>{letter}</button>)}</fieldset><fieldset><legend>Vowel</legend>{vowels.map(letter=><button type="button" key={letter} aria-label={`Choose vowel ${letter}`} aria-pressed={vowel===letter} disabled={checked&&correct} onClick={()=>{setVowel(letter);setChecked(false);}}>{letter}</button>)}</fieldset></div></>:<><p>Type the combined Hangul block. You can use your own Korean keyboard or the one below.</p><KoreanInput value={written} onChange={value=>{setWritten(value);setChecked(false);}} disabled={checked&&correct} maxLength={12} label="Write the combined Hangul block" placeholder="One Hangul block"/></>}
 {checked&&<div role="status" className={styles.feedback}>{correct?<><SoriMascot thumbsUp className={styles.mascot}/><p>That’s it: <strong lang="ko">{sample.korean}</strong> · {sample.romanization}. Romanization is an approximate reading cue.</p></>:<p>Try again. Put {sample.letters[0]} and {sample.letters[1]} into one Hangul block. Use Hangul, rather than romanization, for this writing exercise.</p>}</div>}
 <div className={styles.actions}><button type="button" className="button button-dark" disabled={!block} onClick={()=>{if(checked&&correct){setIndex(current=>current+1);resetAnswer();}else check();}}>{checked&&correct?index===samples.length-1?"Finish this round":"Next block":"Check my block"}</button><button type="button" className="button button-quiet" onClick={onClose}>Back to practice</button></div>
 {clip&&<label className={styles.audio}>Hear the sample · {preferences.speechVoice==="chris"?"Chris":"Jessica"}<audio ref={audio} key={`${sample.id}-${mode}`} controls preload="none" src={clip} onLoadedMetadata={event=>{event.currentTarget.playbackRate=preferences.speechPace;}} aria-label="Hear this Hangul block"/></label>}
 <WordReference word={sample.korean} readingSample/>
 </section>;
}
