"use client";
import {useMemo,useState} from 'react';
import {checkpointItems,type CheckpointItem} from '../weekly-checkpoint';
import {isCorrectTextAnswer,normalizeAnswer} from '../curriculum';
import {WordReference} from './word-reference';
import {KoreanInput} from './korean-keyboard';
export function WeeklyCheckpoint({completed}:{completed:string[]}){
 const available=useMemo(()=>checkpointItems(completed),[completed]);
 const [session,setSession]=useState<CheckpointItem[]>([]),[index,setIndex]=useState(0),[answer,setAnswer]=useState(''),[checked,setChecked]=useState(false),[missed,setMissed]=useState<CheckpointItem[]>([]);
 const item=session[index],correct=!!item&&(item.question.type==='text'?isCorrectTextAnswer(item.question,answer):normalizeAnswer(answer)===normalizeAnswer(item.question.answer));
 function start(items=available){setSession(items);setIndex(0);setAnswer('');setChecked(false);setMissed([]);}
 function check(){if(!item||checked||!answer.trim())return;setChecked(true);if(!correct)setMissed(items=>[...items,item]);}
 function next(){setIndex(value=>value+1);setAnswer('');setChecked(false);}
 return <section className="weekly-checkpoint" aria-labelledby="checkpoint-title"><h3 id="checkpoint-title">Your weekly checkpoint</h3>
 {!session.length?<><p>A short check-in using only completed lessons. Try it any time; there’s no deadline, timer, or streak penalty.</p>{available.length?<><p>{available.length} questions · No changes to lesson completion or review dates.</p><button className="button button-soft" onClick={()=>start()}>Try {available.length} questions</button></>:<p>Complete a lesson first. Your checkpoint will use its questions, not material above your starting point.</p>}</>:item?<>
 <div className="flashcard-tools"><span role="status">Question {index+1} of {session.length}</span><button className="button button-quiet" onClick={()=>setSession([])}>Finish for now</button></div>
 <div key={item.id} className="practice-question lesson-step-motion"><small>From {item.lessonTitle}</small><h4>{item.question.prompt}</h4>{normalizeAnswer(item.question.answer)!==normalizeAnswer(item.question.korean)&&<p lang="ko" className="practice-target">{item.question.korean}</p>}
 <form onKeyDown={event=>{if((event.key==="Enter"||event.keyCode===229)&&(event.nativeEvent.isComposing||event.keyCode===229))event.preventDefault();}} onSubmit={event=>{event.preventDefault();checked?next():check();}}>
 {item.question.type==='choice'?<div className="choice-list" role="group" aria-label="Checkpoint answer choices">{item.question.choices.map(choice=><button type="button" key={choice} className={`choice ${answer===choice?'chosen':''}`} aria-pressed={answer===choice} disabled={checked} onClick={()=>setAnswer(choice)}>{choice}</button>)}</div>:/[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(item.question.answer)?<KoreanInput value={answer} onChange={setAnswer} disabled={checked} label="Your checkpoint answer"/>:<label className="text-answer-field">Your answer<input autoComplete="off" autoCapitalize="none" value={answer} disabled={checked} onChange={event=>setAnswer(event.target.value)}/></label>}
 {checked&&<div className="checkpoint-feedback" role="status"><strong>{correct?'That matches.':'Let’s revisit this one.'}</strong><p>Answer: {item.question.answer}</p><p>{item.question.tip}</p><WordReference word={item.question.korean} readingSample={/block|syllable|reading sample/iu.test(item.question.prompt+" "+item.question.tip)}/></div>}
 <button className="button button-dark" disabled={!answer.trim()} type="submit">{checked?(index+1===session.length?'See recap':'Next question'):'Check answer'}</button></form></div></>:<>
 <p role="status">{session.length-missed.length} of {session.length} matched on the first try. This is practice, not a proficiency score.</p>
 {missed.length?<><h4>A useful next step</h4><ul>{[...new Set(missed.map(item=>item.lessonTitle))].map(title=><li key={title}>Revisit {title} in Learn.</li>)}</ul><button className="button button-soft" onClick={()=>start(missed)}>Practice the missed questions</button></>:<p>You recalled these items. Continue your learning path whenever you’re ready.</p>}
 <button className="button button-quiet" onClick={()=>setSession([])}>Finish checkpoint</button></>}
 </section>;
}
