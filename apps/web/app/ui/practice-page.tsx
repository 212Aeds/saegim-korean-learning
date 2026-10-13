"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LearningProfile } from "../learning-profile";
import type { SavedProgress, LearningPreferences } from "../progress";
import { practicePool, practiceSession, type PracticeMode, type PracticeCard } from "../practice-bank";
import { isCorrectTextAnswer, normalizeAnswer } from "../curriculum";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { playElevenLabsKorean, stopKoreanPlayback } from "./speech";
import { playCorrectAnswerSound } from "./feedback-sound";
import { FeedbackToggle } from "./feedback-toggle";
const modes: Record<PracticeMode, { title: string; description: string }> = {
  letters: { title: "Letter shapes & sounds", description: "Recall names and write familiar letters." },
  reading: { title: "Build & read blocks", description: "Combine letters from your current learning steps." },
  words: { title: "Words you’re learning", description: "Recall meanings, spellings, and pronunciation cues." },
  sentences: { title: "Sentences & conversations", description: "Put familiar patterns into useful replies." },
  mixed: { title: "A little of everything", description: "Mix the material available at your level." },
};
export function PracticePage({ progress, profile, preferences, onSessionComplete }: { progress: SavedProgress; profile: LearningProfile; preferences: LearningPreferences; onSessionComplete: () => void }) {
  const pool = useMemo(() => practicePool(progress, profile, "mixed"), [progress, profile]);
  const [mode, setMode] = useState<PracticeMode>(profile.level === "new" ? "letters" : (profile.level === "intermediate" || profile.level === "advanced") ? "sentences" : "words");
  const [count, setCount] = useState(10);
  const [session, setSession] = useState<PracticeCard[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [audioNotice, setAudioNotice] = useState("");
  const [audioBusy, setAudioBusy] = useState(false);
  const actionButton = useRef<HTMLButtonElement | null>(null);
  const completed = useRef(false);
  const playback = useRef(0);
  useEffect(() => () => { playback.current++; stopKoreanPlayback(); }, []);
  const card = session[index];
  const correct = card ? card.question.type === "text" ? isCorrectTextAnswer(card.question, answer) : answer === card.question.answer : false;
  useEffect(() => { if (checked && correct) actionButton.current?.focus(); }, [checked, correct]);
  const hideTarget = card && (card.listening || card.question.id.startsWith("drill-choice-") || card.question.id.startsWith("drill-shape-") || (card.question.type === "text" && /[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(card.question.answer) && normalizeAnswer(card.question.answer) === normalizeAnswer(card.question.korean)));
  const available = mode === "mixed" ? pool : pool.filter((item) => item.mode === mode);
  function start(cards = available) {
    playback.current++; stopKoreanPlayback(); setAudioBusy(false); setAudioNotice("");
    setSession(practiceSession(cards, count)); setIndex(0); setAnswer(""); setChecked(false); setFirstTry(0); setMissed([]); completed.current = false;
  }
  function check() {
    if (!card || !answer.trim() || checked) return;
    setChecked(true);
    if (correct) playCorrectAnswerSound();
    else setMissed((current) => current.includes(card.question.id) ? current : [...current, card.question.id]);
  }
  function next() {
    if (!card || !checked || !correct) return;
    if (!missed.includes(card.question.id)) setFirstTry((current) => current + 1);
    setIndex((current) => current + 1); setAnswer(""); setChecked(false);
    playback.current++; stopKoreanPlayback(); setAudioBusy(false); setAudioNotice("");
    if (index + 1 === session.length && !completed.current) { completed.current = true; onSessionComplete(); }
  }
  async function listen() {
    if (!card || audioBusy) return;
    const attempt = ++playback.current; setAudioBusy(true); setAudioNotice("");
    const result = await playElevenLabsKorean(card.reference, preferences.speechVoice, preferences.speechPace, {naturalOnly:true});
    if (attempt !== playback.current) return;
    setAudioBusy(false); if (!result.played) setAudioNotice("The selected voice is unavailable. Keep practicing or try Listen again.");
  }
  if (session.length && !card) return <section className="practice-session-card lesson-step-motion">
    <span className="micro-label">PRACTICE COMPLETE</span><h2>A little steadier than before.</h2>
    <div className="review-summary"><strong>{session.length}<span>questions practiced</span></strong><strong>{firstTry}<span>right on the first try</span></strong><strong>{missed.length}<span>needed another try</span></strong></div>
    <p>This counts as a learning day. Practice does not mark lessons complete or change your review dates.</p>
    <div className="flashcard-tools">{missed.length > 0 && <button className="button button-soft" onClick={() => start(session.filter((item) => missed.includes(item.question.id)))}>Repeat the tricky ones</button>}<button className="button button-dark" onClick={() => start()}>Another fresh round</button><button className="button button-quiet" onClick={() => setSession([])}>Choose a different focus</button></div>
  </section>;
  if (card) return <section className="practice-session-card" aria-labelledby="practice-title">
    <div className="practice-session-top"><span className="micro-label">{modes[mode].title} · {index + 1} / {session.length}</span><button className="button button-quiet" onClick={() => { playback.current++; stopKoreanPlayback(); setSession([]); }}>Leave practice</button></div>
    <div className="review-session-progress" role="progressbar" aria-label="Practice questions completed" aria-valuemin={0} aria-valuemax={session.length} aria-valuenow={index}><i style={{transform:`scaleX(${index/session.length})`}} /></div>
    <div key={card.question.id} className="practice-question lesson-step-motion">
      <span className="practice-target" lang="ko">{card.listening ? "♫" : hideTarget ? "?" : card.question.korean}</span><h2 id="practice-title">{card.question.prompt}</h2>
      {card.question.type === "choice" ? <div className="choice-list" role="group" aria-label="Answer choices">{card.question.choices.map((choice) => <button className={`choice ${answer === choice ? "chosen" : ""}`} aria-pressed={answer === choice} key={choice} disabled={checked && correct} onClick={() => {setAnswer(choice);setChecked(false);}}>{choice}</button>)}</div> : <label className="text-answer-field"><span>Your answer</span>{/[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(card.question.answer) ? <KoreanInput disabled={checked && correct} value={answer} onChange={(value)=>{setAnswer(value);setChecked(false);}} label={card.question.prompt} placeholder={card.question.placeholder} /> : <input disabled={checked && correct} value={answer} autoComplete="off" autoCapitalize="none" placeholder={card.question.placeholder} aria-label={card.question.prompt} onChange={(event)=>{setAnswer(event.target.value);setChecked(false);}} onKeyDown={(event)=>{if(event.key === "Enter" && !event.nativeEvent.isComposing) checked && correct ? next() : check();}} />}</label>}
      {checked && <p className={`answer-tip ${correct ? "correct" : "try-again"}`} role="status">{correct ? "That’s it. " : "Try again. "}{card.question.tip}</p>}
      <div className="flashcard-tools"><button ref={actionButton} className="button button-dark" disabled={!answer.trim()} onClick={checked && correct ? next : check}>{checked && correct ? index+1 === session.length ? "Finish this round" : "Next question" : "Check answer"}</button>{card.reference !== "?" && !card.question.id.startsWith("drill-shape-") && <button className="button button-quiet" disabled={audioBusy} onClick={()=>void listen()}>{audioBusy ? "Loading voice…" : `Listen with ${preferences.speechVoice === "chris" ? "Chris" : "Jessica"}`}</button>}</div>
      {audioNotice && <p role="status">{audioNotice}</p>}
      {(!hideTarget || checked) && <WordReference word={card.reference} readingSample={card.readingSample} />}
    </div>
  </section>;
  return <div className="practice-page"><section className="practice-intro"><span className="micro-label">SMALL ROUNDS. AS MUCH PRACTICE AS YOU WANT.</span><h2>Make familiar Korean feel easier.</h2><p>Fresh questions from completed lessons and your next step. New learners practice letters before vocabulary; changing your level refreshes the available material.</p></section>
    <div className="practice-focus-grid">{Object.entries(modes).map(([id, item]) => {const size=id === "mixed" ? pool.length : pool.filter(card=>card.mode===id).length;return <button key={id} className={`practice-focus ${mode===id ? "is-selected" : ""}`} aria-pressed={mode===id} disabled={!size} onClick={()=>setMode(id as PracticeMode)}><strong>{item.title}</strong><span>{item.description}</span><small>{size ? `${size} questions available` : "Opens as you learn the foundations"}</small></button>;})}</div>
    <div className="practice-start"><FeedbackToggle /><label>Round size<select value={count} onChange={event=>setCount(Number(event.target.value))}><option value={5}>Up to 5 questions</option><option value={10}>Up to 10 questions</option><option value={20}>Up to 20 questions</option></select></label><button className="button button-dark" disabled={!available.length} onClick={()=>start()}>Start a fresh round</button></div>
    <p className="practice-footnote">Repeat whenever you want. Lessons and scheduled review keep their own progress.</p>
  </div>;
}
