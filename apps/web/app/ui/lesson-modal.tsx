"use client";
import { paidFeaturesEnabled } from "../release";
import { localSpeechUrl } from "./local-speech-server";
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
import { prepareQuestions } from "./lesson-questions";
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
  const [sets] = useState(() => prepareQuestions(lesson));
  const [phase, setPhase] = useState<"briefing" | "practice" | "quiz">(
    lesson.briefing ? "briefing" : "practice",
  );
  const questions = phase === "practice" ? sets.practice : sets.quiz;
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
  const correct = question
    ? question.type === "choice"
      ? choice === question.answer
      : isCorrectTextAnswer(question, typed) || Boolean(
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
    ? !question.id.includes("-shape-") && Boolean(currentWord || currentSyllable) &&
      (Array.from(question.id).reduce((sum, character) => sum + character.charCodeAt(0), lesson.id.length) % 3) === 0
    : false;
  const hintText = preferences.hintLevel === "challenge"
    ? tipSentences[0] ?? ""
    : tipSentences.join(" ");
  const progress = phase === "briefing"
    ? 0.04
    : phase === "practice"
      ? 0.05 + 0.7 * (step / sets.practice.length)
      : 0.75 + 0.25 * (step / sets.quiz.length);

  useEffect(() => {
    setAudioNotice(""); setAudioBusy(false);
    return () => { playbackAttempt.current += 1; stopKoreanPlayback(); };
  }, [phase, step, preferences.speechVoice]);
  useEffect(() => { const text = phase === "briefing" ? lesson.briefing?.example : question?.korean; if (text) void prefetchLocalKorean(text, preferences.speechVoice); }, [phase, question?.korean, lesson.briefing?.example, preferences.speechVoice]);
  async function listen(text: string, rate = preferences.speechPace) {
    const attempt = ++playbackAttempt.current;
    setAudioBusy(true); setAudioNotice("");
    const result = await playElevenLabsKorean(text, preferences.speechVoice, rate, { naturalOnly: true, waitForEnd: true });
    if (attempt !== playbackAttempt.current) return;
    setAudioBusy(false);
    if (!result.played) setAudioNotice("Korean audio is unavailable on this device. Continue with writing or enable a local Korean voice in your device settings.");
  }

  function advance() {
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
      if (!speechResult || (phase === "practice" && !speechResult.matches)) return;
      advance();
      return;
    }
    if (!readyToCheck) return;
    if (!showTip) {
      if (!attempted) {
        setAttempted(true);
        if (phase === "practice" && correct) {
          playCorrectAnswerSound();
          setPracticeCorrect((count) => count + 1);
        }
        if (phase === "quiz" && correct) {
          playCorrectAnswerSound();
          setQuizCorrect((count) => count + 1);
        }
      }
      setShowTip(true);
      return;
    }

    if (phase === "practice" && !correct) return;
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

        {phase === "briefing" && lesson.briefing ? (
          <div className="lesson-briefing lesson-step-motion">
            <span className="question-count">BEFORE YOU PRACTICE</span>
            <p className="briefing-focus">{lesson.briefing.focus}</p>
            <h2 id="lesson-title">{lesson.briefing.explanation}</h2>
            <div className="briefing-use">
              <span className="micro-label">WHEN TO USE IT</span>
              <p>{lesson.briefing.useWhen}</p>
            </div>
            <div className="briefing-example">
              <span className="micro-label">KOREAN EXAMPLE</span>
              <strong lang="ko">{lesson.briefing.example}</strong>
              <span>{lesson.briefing.translation}</span>
              <div className="lesson-audio-actions">
                <button type="button" className="button button-quiet lesson-briefing-listen" onClick={() => { if (lesson.briefing) void listen(lesson.briefing.example, 1); }}><SpeakerHigh size={16} /> Hear Korean · 1.00×</button>
                <button type="button" className="button button-quiet lesson-briefing-listen lesson-slow-listen" onClick={() => { if (lesson.briefing) void listen(lesson.briefing.example, 0.75); }}>Slower · 0.75×</button>
              </div>
            </div>
            {lesson.briefing.watchFor && (
              <p className="briefing-watch"><strong>Watch for:</strong> {lesson.briefing.watchFor}</p>
            )}
            <button className="button button-dark continue-button" onClick={() => { setPhase("practice"); setStep(0); }}>
              Start practice <ArrowRight size={17} />
            </button>
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
            <p>Final quiz: {quizCorrect} of {sets.quiz.length}. Your lesson items are added to spaced review.</p>
            <button className="button button-dark" onClick={() => onComplete(lesson, { correct: quizCorrect, total: sets.quiz.length })}>
              Finish this lesson <ArrowRight size={17} />
            </button>
          </div>
        ) : question ? (
          <div key={`${phase}-${question.id}`} className="lesson-question lesson-step-motion">
            <span className="question-count">
              {phase === "practice" ? "PRACTICE" : "QUIZ"} {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
            </span>
            <div className="letter-stage"><span lang="ko">{!speechPracticeTurn && (question.id.startsWith("word-hangul-") || (question.id.startsWith("letter-build-") || question.id.includes("-shape-"))) ? "?" : question.korean}</span></div>
            <WordReference word={question.korean} readingSample={Boolean(currentSyllable) || (lesson.category === "Hangul" && (question.korean.includes("+") || lesson.id.startsWith("hangul-read-")))} source={currentWord?.source} license={currentWord?.license} reviewStatus={currentWord?.reviewStatus} />
            <div className="lesson-audio-actions">
              <button type="button" className="lesson-listen-button" aria-label="Hear this Korean phrase at the selected pace" disabled={audioBusy} onClick={() => void listen(question.korean)}><SpeakerHigh size={17} weight="fill" /><span>{audioBusy ? "Loading voice…" : `Listen · ${!paidFeaturesEnabled && !localSpeechUrl ? "Device voice" : preferences.speechVoice === "chris" ? "Chris" : "Jessica"} · ${preferences.speechPace.toFixed(2)}×`}</span></button>
              <button type="button" className="lesson-listen-button lesson-slow-listen" aria-label="Hear this Korean phrase more slowly" disabled={audioBusy} onClick={() => void listen(question.korean, 0.75)}>Slower · 0.75×</button>
            </div>
            {preferences.romanization && romanization && !question.id.startsWith("word-hangul-") && !(question.id.startsWith("letter-build-") || question.id.includes("-shape-")) && (showTip || (phase !== "quiz" && !romanizationRevealsAnswer)) && (
              <p className="lesson-romanization" lang="ko-Latn">{romanization}</p>
            )}
            <h2 id="lesson-title">{speechPracticeTurn ? "Say this Korean aloud." : question.prompt}</h2>
            {speechPracticeTurn ? <>
              <OpenRouterListeningPractice
                key={`${phase}-${question.id}`}
                variant="lesson-speaking"
                korean={question.korean}
                expectedRomanization={romanization}
                selectedVoice={preferences.speechVoice}
                onVoiceChange={(speechVoice) => onPreferencesChange({ ...preferences, speechVoice })}
                onResult={(transcript, matches) => {
                  setSpeechResult({ transcript, matches });
                  if (matches && !attempted) {
                    setAttempted(true);
                    playCorrectAnswerSound();
                    if (phase === "practice") setPracticeCorrect((count) => count + 1);
                    else setQuizCorrect((count) => count + 1);
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
                  <button key={item} className={`choice ${choice === item ? "chosen" : ""} ${showTip && item === question.answer ? "right-answer" : ""}`} onClick={() => { setChoice(item); setShowTip(false); }} aria-pressed={choice === item}>
                    {item}{showTip && item === question.answer && <CheckCircle size={18} weight="fill" />}
                  </button>
                ))}
              </div>
            ) : !speechPracticeTurn && question.type === "text" ? (
              <label className="text-answer-field">
                <span>Your answer</span>
                {/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(question.answer)
                  ? <KoreanInput value={typed} onChange={(value) => { setTyped(value); setShowTip(false); }} label={question.prompt} placeholder="Type Korean" onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && readyToCheck) checkOrContinue(); }} />
                  : <input autoComplete="off" autoCapitalize="none" value={typed} onChange={(event) => { setTyped(event.target.value); setShowTip(false); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && readyToCheck) checkOrContinue(); }} placeholder={question.placeholder} aria-label={question.prompt} />}
              </label>
            ) : null}
            {!speechPracticeTurn && showTip && (
              <p className={`answer-tip ${correct ? "correct" : "try-again"}`} role="status">
                {phase === "quiz" ? (correct ? "Correct. " : "Not quite. ") : (correct ? "That’s it. " : "Take another try. ")}
                {preferences.hintLevel === "gentle" && phase === "practice"
                  ? ""
                  : <>{preferences.hintLevel === "challenge" ? "Challenge nudge: " : ""}{hintText}</>}
              </p>
            )}
            <button className="button button-dark continue-button" onClick={checkOrContinue} disabled={speechPracticeTurn ? !speechResult || (phase === "practice" && !speechResult.matches) : !readyToCheck || (showTip && phase === "practice" && !correct)}>
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
