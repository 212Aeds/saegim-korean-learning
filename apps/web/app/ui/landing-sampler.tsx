"use client";
import {useState} from "react";
import {landingSamples} from "../landing-samples";
import {playCorrectAnswerSound} from "./feedback-sound";
import {WordReference} from "./word-reference";
export function LandingSampler({onStart}:{onStart:()=>void}) {
 const [index,setIndex]=useState(0),[answer,setAnswer]=useState("");
 const sample=landingSamples[index],question=sample.question,correct=answer===question.answer;
 return <section className="landing-sampler" id="try-korean" aria-labelledby="sample-title">
  <div className="sample-intro"><span className="micro-label">TRY KOREAN HERE</span><h2 id="sample-title">Try a sample lesson.</h2><p>No account needed for this preview. Pick an answer, see the explanation, and try another example.</p><div className="sample-selector" role="group" aria-label="Choose a lesson preview">{landingSamples.map((item,i)=><button type="button" key={item.lessonId} aria-pressed={index===i} onClick={()=>{setIndex(i);setAnswer("");}}>{item.label}</button>)}</div></div>
  <div className="sample-question" key={question.id}><span className="micro-label">{sample.label}</span><p className="sample-korean" lang="ko">{question.korean}</p><h3>{question.prompt}</h3><div className="sample-choices" role="group" aria-label="Preview answers">{question.choices.map(choice=><button type="button" key={choice} aria-pressed={answer===choice} disabled={correct} className={answer===choice?(correct?"is-correct":"is-retry"):""} onClick={()=>{setAnswer(choice);if(choice===question.answer)playCorrectAnswerSound();}}>{choice}</button>)}</div>
   <div className="sample-feedback" role="status" aria-live="polite">{answer&&<><strong>{correct?"You got it!":"Give it another try."}</strong><p>{question.tip}</p></>}</div>
   <WordReference word={question.korean}/><button type="button" className="button button-dark" onClick={onStart}>Find my learning path →</button><small>Preview answers do not change your learning progress.</small>
  </div>
 </section>;
}
