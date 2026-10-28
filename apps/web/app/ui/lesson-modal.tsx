"use client";
import {lessonTextAssessment, appendLessonRetry} from "./lesson-answer";
import {isStarterLesson} from "../first-session";
import { ListeningControls } from "./listening-controls";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle, SpeakerHigh, X } from "./icons";
import { useDialogFocus } from "./use-dialog-focus";
import {
  isCorrectTextAnswer,
  normalizeAnswer,
  shuffle,
  type Lesson,
  type LessonQuestion,
  type MultipleChoiceQuestion,
  type TextQuestion,
} from "../curriculum";
import { additionalVocabulary, hangulLetters, hangulSyllableExamples } from "../more-lessons";
import { wordBank, type KoreanWord } from "../word-bank";
import type { LearningPreferences } from "../progress";
import { OpenRouterListeningPractice } from "./openrouter-listening-practice";
import { SoriMascot } from "./sori-mascot";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { playElevenLabsKorean, prefetchLocalKorean, stopKoreanPlayback } from "./speech";
import { prepareQuestions, lessonIntroduction, lessonTopicIntroduction, lessonLetterIntroduction } from "./lesson-questions";
import { playCorrectAnswerSound } from "./feedback-sound";

const allWords: KoreanWord[] = [
  ...wordBank,
  ...additionalVocabulary,
  ...hangulLetters,
];

function completeTipSentences(tip: string) {
  const trimmed = tip.trim();
  if (!trimmed) return ["Review the Hangul blocks and recall the lesson example before trying again."];
  const sentences = trimmed.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean);
  return sentences?.length ? sentences : [trimmed];
}

function normalizeRomanizedAnswer(value: string) {
  return value.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export function LessonModal({
  lesson,
  preferences,
  onClose,
  onPreferencesChange,
  onComplete,
}: {
  lesson: Lesson;
  preferences: LearningPreferences;
  onClose: () => void;
  onPreferencesChange: (preferences: LearningPreferences) => void;
  onComplete: (lesson: Lesson, score: { correct: number; total: number }) => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogFocus(dialogRef, onClose);
  const introduction = lessonIntroduction(lesson);
  const [seenTopics,setSeenTopics]=useState<string[]>([]);
  const [sets] = useState(() => prepareQuestions(lesson));
  const [phase, setPhase] = useState<"briefing" | "practice" | "quiz">(
    "briefing",
  );
  const [practiceQueue,setPracticeQueue]=useState(sets.practice);
  const [quizQueue,setQuizQueue]=useState(sets.quiz);
  const questions = phase === "practice" ? practiceQueue : quizQueue;
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [audioNotice, setAudioNotice] = useState("");
  const [audioBusy, setAudioBusy] = useState(false);
  const playbackAttempt = useRef(0);
  const [showTip, setShowTip] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ transcript: string; matches: boolean } | null>(null);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const question = questions[step];
  const topic = phase === "practice" ? lessonTopicIntroduction(question,lesson) : null;
  const showTopic = topic && !seenTopics.includes(topic.id);
  const letterIntro = phase === "practice" ? lessonLetterIntroduction(question, lesson) : null;
  const showLetter = letterIntro && !seenTopics.includes(letterIntro.id);
  const currentWord = question
    ? allWords.find((word) => word.korean === question.korean)
    : undefined;
  const currentSyllable = question && lesson.category === "Hangul"
    ? hangulSyllableExamples.find((sample) => sample.korean === question.korean)
    : undefined;
  const romanization = currentSyllable?.romanization ?? currentWord?.romanization;
  const romanizationRevealsAnswer = question && romanization
    ? [question.answer, ...(question.type === "text" ? question.accepted : [])]
        .some((answer) => normalizeAnswer(answer) === normalizeAnswer(romanization))
    : false;
  const practiceDone = phase === "practice" && step >= questions.length;
  const quizDone = phase === "quiz" && step >= questions.length;
  const assessment = question?.type === "text" ? lessonTextAssessment(question,typed) : {correct:false,near:false};
  const originalTurn = step < (phase === "practice" ? sets.practice.length : sets.quiz.length);
  const correct = question
    ? question.type === "choice"
      ? choice === question.answer
      : assessment.correct || Boolean(
          !question.id.startsWith("word-hangul-") && !(question.id.startsWith("letter-build-") || question.id.includes("-shape-")) && /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(question.answer) && romanization &&
          normalizeRomanizedAnswer(typed) === normalizeRomanizedAnswer(romanization),
        )
    : false;
  const readyToCheck = question
    ? question.type === "choice"
      ? choice !== null
      : typed.trim().length > 0
    : false;
  const tipSentences = question ? completeTipSentences(question.tip) : [];
  const speechPracticeTurn = question
    ? !isStarterLesson(lesson.id) && !question.id.includes("-shape-") && Boolean(currentWord || currentSyllable) &&
      (Array.from(question.id).reduce((sum, character) => sum + character.charCodeAt(0), lesson.id.length) % 3) === 0
    : false;
  const hintText = preferences.hintLevel === "challenge"
    ? tipSentences[0] ?? ""
    : tipSentences.join(" ");
  const progress = phase === "briefing"
    ? 0.04
    : phase === "practice"
      ? 0.05 + 0.7 * (step / questions.length)
      : 0.75 + 0.25 * (step / questions.length);

  useEffect(() => {
    setAudioNotice(""); setAudioBusy(false);
    return () => { playbackAttempt.current += 1; stopKoreanPlayback(); };
  }, [phase, step, preferences.speechVoice, showLetter]);
  useEffect(() => { const text = phase === "briefing" ? introduction.example : showLetter ? letterIntro.audioText : question?.korean; if (text) void prefetchLocalKorean(text, preferences.speechVoice); }, [phase, question?.korean, introduction.example, preferences.speechVoice, showLetter, letterIntro?.audioText]);
  async function listen(text: string, rate = preferences.speechPace) {
    const attempt = ++playbackAttempt.current;
    setAudioBusy(true); setAudioNotice("");
    const result = await playElevenLabsKorean(text, preferences.speechVoice, rate, { consistentVoice: true, naturalOnly: true, waitForEnd: true });
    if (attempt !== playbackAttempt.current) return;
    setAudioBusy(false);
    if (!result.played) setAudioNotice("The matching voice could not start. Try Listen again, or continue with writing.");
  }

  function advance() {
    const matched = speechPracticeTurn ? speechResult?.matches : correct;
    if (!matched) {
      if (phase === "practice") setPracticeQueue(current=>appendLessonRetry(current,step));
      else setQuizQueue(current=>appendLessonRetry(current,step));
    }
    setStep((current) => current + 1);
    setChoice(null);
    setTyped("");
    setShowTip(false);
    setAttempted(false);
    setSpeechResult(null);
  }

  function checkOrContinue() {
    if (!question) return;
    if (speechPracticeTurn) {
      if (!speechResult) return;
      advance();
      return;
    }
    if (!readyToCheck) return;
    if (!showTip) {
      if (!attempted) {
        setAttempted(true);
        if (correct) playCorrectAnswerSound();
        if (phase === "practice" && correct && originalTurn) {
          setPracticeCorrect((count) => count + 1);
        }
        if (phase === "quiz" && correct && originalTurn) {
          setQuizCorrect((count) => count + 1);
        }
      }
      setShowTip(true);
      return;
    }

    advance();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className={`lesson-modal ${preferences.hangulSize === "large" ? "hangul-large" : ""}`} role="dialog" aria-modal="true" aria-labelledby="lesson-title">
        <div className="modal-top">
          <span className="micro-label">
            {phase === "briefing" ? "LESSON BRIEFING" : phase === "practice" ? "LEARN & RECALL" : "FINAL QUIZ"} <span>·</span> {lesson.title.toUpperCase()}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close lesson"><X size={20} /></button>
        </div>
        <ListeningControls voice={preferences.speechVoice} pace={preferences.speechPace} disabled={audioBusy} onVoiceChange={speechVoice => onPreferencesChange({...preferences,speechVoice})} onPaceChange={speechPace => onPreferencesChange({...preferences,speechPace})} />
        {audioBusy && <button className="button button-quiet" onClick={()=>{playbackAttempt.current++;stopKoreanPlayback();setAudioBusy(false);}}>Stop audio</button>}
        <div className="lesson-progress"><i style={{ transform: `scaleX(${Math.min(1, progress)})` }} /></div>

        {phase === "briefing" && introduction ? (
          <div className="lesson-briefing lesson-step-motion">
            <span className="question-count">BEFORE YOU PRACTICE</span>
            <p className="briefing-focus">{introduction.focus}</p>
            <h2 id="lesson-title">{introduction.explanation}</h2>
            <div className="briefing-use">
              <span className="micro-label">WHEN TO USE IT</span>
              <p>{introduction.useWhen}</p>
            </div>
            <div className="briefing-example">
              <span className="micro-label">KOREAN EXAMPLE</span>
              <strong lang="ko">{introduction.example}</strong>
              <span>{introduction.translation}</span>
              <div className="lesson-audio-actions">
                <button type="button" disabled={audioBusy} className="button button-quiet lesson-briefing-listen" onClick={() => { if (introduction) void listen(introduction.example); }}><SpeakerHigh size={16} /> {audioBusy ? "Playing Korean…" : `Hear Korean · ${preferences.speechPace.toFixed(2)}×`}</button>
              </div>
            </div>
            {introduction.watchFor && (
              <p className="briefing-watch"><strong>Watch for:</strong> {introduction.watchFor}</p>
            )}
            <button className="button button-dark continue-button" onClick={() => { setPhase("practice"); setStep(0); }}>
              Start practice <ArrowRight size={17} />
            </button>
          </div>
        ) : showLetter ? (
          <div className="lesson-briefing lesson-step-motion">
            <span className="question-count">LETTER &amp; SOUND</span>
            <h2 id="lesson-title">{letterIntro.title}</h2>
            <p>{letterIntro.explanation}</p>
            <div className="briefing-example">
              <span className="micro-label">LISTEN TO THE SOUND</span>
              <strong lang="ko">{letterIntro.audioText}</strong>
              <span>{letterIntro.romanization}</span>
              <button type="button" className="button button-quiet" disabled={audioBusy} onClick={() => void listen(letterIntro.audioText)}><SpeakerHigh size={16} /> {audioBusy ? "Playing…" : `Listen · ${preferences.speechVoice === "chris" ? "Chris" : "Jessica"}`}</button>
            </div>
            <WordReference word={letterIntro.letter} />
            <button className="button button-dark continue-button" onClick={() => setSeenTopics(current => [...current, letterIntro.id])}>Practice this letter <ArrowRight size={17} /></button>
          </div>
        ) : showTopic ? (
          <div className="lesson-briefing lesson-step-motion">
            <span className="question-count">A NEW SKILL</span>
            <h2 id="lesson-title">{topic.title}</h2><p>{topic.explanation}</p>
            <div className="briefing-example"><strong lang="ko">{topic.example}</strong><span>{topic.translation}</span></div>
            <WordReference word="가" readingSample />
            <button className="button button-dark continue-button" onClick={()=>setSeenTopics(current=>[...current,topic.id])}>Try building a block <ArrowRight size={17} /></button>
          </div>
        ) : practiceDone ? (
          <div className="lesson-complete lesson-step-motion">
            <SoriMascot className="lesson-complete-mascot" />
            <div className="complete-stamp"><Check size={30} weight="bold" /></div>
            <span className="micro-label">PRACTICE COMPLETE</span>
            <h2 id="lesson-title">Now show<br /><em>what stayed.</em></h2>
            <p>{sets.quiz.length} shuffled questions—one for each lesson item, plus the authored rule checks. A few rounds focus on speaking; switch to writing if your mic is unavailable.</p>
            <button className="button button-dark" onClick={() => { setPhase("quiz"); setStep(0); }}>
              Take the lesson quiz <ArrowRight size={17} />
            </button>
          </div>
        ) : quizDone ? (
          <div className="lesson-complete lesson-step-motion">
            <SoriMascot className="lesson-complete-mascot" />
            <div className="complete-stamp"><Check size={30} weight="bold" /></div>
            <span className="micro-label">LESSON COMPLETE</span>
            <h2 id="lesson-title">You finished<br /><em>{lesson.title}.</em></h2>
            <p>First-attempt quiz recall: {quizCorrect} of {sets.quiz.length}. Missed questions were practiced again. Your lesson items are added to spaced review.</p>
            <button className="button button-dark" onClick={() => onComplete(lesson, { correct: quizCorrect, total: sets.quiz.length })}>
              Finish this lesson <ArrowRight size={17} />
            </button>
          </div>
        ) : question ? (
          <div key={`${phase}-${step}-${question.id}`} className="lesson-question lesson-step-motion">
            <span className="question-count">
              {phase === "practice" ? "PRACTICE" : "QUIZ"} {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
            </span>
            <div className="letter-stage"><span lang="ko">{!speechPracticeTurn && (question.id.startsWith("word-hangul-") || (question.id.startsWith("letter-build-") || question.id.includes("-shape-"))) ? "?" : question.korean}</span></div>
            <WordReference word={question.korean} readingSample={Boolean(currentSyllable) || (lesson.category === "Hangul" && (question.korean.includes("+") || lesson.id.startsWith("hangul-read-")))} source={currentWord?.source} license={currentWord?.license} reviewStatus={currentWord?.reviewStatus} />
            {!speechPracticeTurn && <div className="lesson-audio-actions">
              <button type="button" className="lesson-listen-button" aria-label="Hear this Korean phrase at the selected pace" disabled={audioBusy} onClick={() => void listen(question.korean)}><SpeakerHigh size={17} weight="fill" /><span>{audioBusy ? "Loading voice…" : `Listen · ${preferences.speechVoice === "chris" ? "Chris" : "Jessica"} · ${preferences.speechPace.toFixed(2)}×`}</span></button>
            </div>}
            {preferences.romanization && romanization && !question.id.startsWith("word-hangul-") && !(question.id.startsWith("letter-build-") || question.id.includes("-shape-")) && (showTip || (phase !== "quiz" && !romanizationRevealsAnswer)) && (
              <p className="lesson-romanization" lang="ko-Latn">{romanization}</p>
            )}
            <h2 id="lesson-title">{speechPracticeTurn ? "Say this Korean aloud." : question.prompt}</h2>
            {speechPracticeTurn ? <>
              <OpenRouterListeningPractice
                key={`${phase}-${step}-${question.id}`}
                variant="lesson-speaking"
                korean={question.korean}
                expectedRomanization={romanization}
                selectedVoice={preferences.speechVoice}
                selectedPace={preferences.speechPace}
                onVoiceChange={(speechVoice) => onPreferencesChange({ ...preferences, speechVoice })}
                onResult={(transcript, matches) => {
                  setSpeechResult({ transcript, matches });
                  if (matches) playCorrectAnswerSound();
                  if (!attempted) {
                    setAttempted(true);
                    if (matches && originalTurn && phase === "practice") setPracticeCorrect((count) => count + 1);
                    else if(matches && originalTurn) setQuizCorrect((count) => count + 1);
                  }
                }}
              />
              {speechResult && <p className={`answer-tip ${speechResult.matches ? "correct" : "try-again"}`} role="status">{speechResult.matches ? "That matches the spoken target." : `I heard “${speechResult.transcript}.” Listen once more and try again, or switch to writing.`}</p>}
            </> : phase === "quiz" && !showTip ? (
              <p className="answer-tip gentle-hint">Trust your first recall. A useful clue appears after you answer.</p>
            ) : preferences.hintLevel === "gentle" && !showTip && !romanizationRevealsAnswer && (
              <p className="answer-tip gentle-hint" aria-label="Gentle hint">
                Gentle clue: {hintText}
              </p>
            )}
            {!speechPracticeTurn && question.type === "choice" ? (
              <div className="choice-list" role="group" aria-label={question.prompt}>
                {question.choices.map((item) => (
                  <button key={item} className={`choice ${choice === item ? "chosen" : ""} ${showTip && item === question.answer ? "right-answer" : ""}`} disabled={showTip} onClick={() => { setChoice(item); setShowTip(false); }} aria-pressed={choice === item}>
                    {item}{showTip && item === question.answer && <CheckCircle size={18} weight="fill" />}
                  </button>
                ))}
              </div>
            ) : !speechPracticeTurn && question.type === "text" ? (
              <label className="text-answer-field">
                <span>Your answer</span>
                {/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(question.answer)
                  ? <KoreanInput value={typed} onChange={(value) => { if(!showTip) setTyped(value); }} label={question.prompt} placeholder="Type Korean" onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && readyToCheck) checkOrContinue(); }} />
                  : <input autoComplete="off" autoCapitalize="none" value={typed} onChange={(event) => { if(!showTip) setTyped(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && readyToCheck) checkOrContinue(); }} placeholder={question.placeholder} aria-label={question.prompt} />}
              </label>
            ) : null}
            {!speechPracticeTurn && showTip && (
              <p className={`answer-tip ${correct ? "correct" : "try-again"}`} role="status">
                {phase === "quiz" ? (correct ? "Correct. " : "Not quite. ") : (correct ? "That’s it. " : "Not quite. This question will return for another try. ")}
                {!correct ? <>Answer: {question.answer}. </> : assessment.near ? <>Accepted with a spelling note. Standard answer: {question.answer}. </> : null}
                {preferences.hintLevel === "gentle" && phase === "practice"
                  ? ""
                  : <>{preferences.hintLevel === "challenge" ? "Challenge nudge: " : ""}{hintText}</>}
              </p>
            )}
            {((!speechPracticeTurn && showTip && correct) || (speechPracticeTurn && speechResult?.matches)) && <SoriMascot thumbsUp className="lesson-answer-mascot" />}
            <button className="button button-dark continue-button" onClick={checkOrContinue} disabled={speechPracticeTurn ? !speechResult : !readyToCheck}>
              {speechPracticeTurn ? (phase === "quiz" ? "Next question" : "Keep going") : showTip ? (phase === "quiz" ? "Next question" : "Keep going") : "Check answer"}<ArrowRight size={17} />
            </button>
          </div>
        ) : null}
        {audioNotice && <p className="lesson-audio-notice" role="status">{audioNotice}</p>}
        <div className="modal-bottom">
          <span>Learn at your own pace. Switch to writing whenever you need to.</span>
          <span className="modal-free"><i /> 100% free</span>
        </div>
      </section>
    </div>
  );
}
