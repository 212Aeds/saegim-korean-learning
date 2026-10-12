"use client";

import { useRef, useState } from "react";
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
import { speakKorean } from "./speech";
import { playCorrectAnswerSound } from "./feedback-sound";

const allWords: KoreanWord[] = [
  ...wordBank,
  ...additionalVocabulary,
  ...hangulLetters,
];

function makeChoice(
  id: string,
  korean: string,
  prompt: string,
  answer: string,
  distractors: string[],
  tip: string,
): MultipleChoiceQuestion {
  return {
    id,
    type: "choice",
    korean,
    prompt,
    choices: Array.from(
      new Set([answer, ...distractors.filter((item) => item !== answer).slice(0, 3)]),
    ),
    answer,
    tip,
  };
}

function makeText(
  id: string,
  korean: string,
  prompt: string,
  answer: string,
  tip: string,
  placeholder: string,
  accepted: string[] = [],
): TextQuestion {
  return { id, type: "text", korean, prompt, answer, accepted, tip, placeholder };
}

function completeTipSentences(tip: string) {
  const trimmed = tip.trim();
  if (!trimmed) return ["Review the Hangul blocks and recall the lesson example before trying again."];
  const sentences = trimmed.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean);
  return sentences?.length ? sentences : [trimmed];
}

function normalizeRomanizedAnswer(value: string) {
  return value.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function generatedQuestions(lesson: Lesson): LessonQuestion[] {
  const words = lesson.words
    .map((korean) => lesson.category === "Hangul" && hangulSyllableExamples.some((sample) => sample.korean === korean)
      ? undefined
      : allWords.find((word) => word.korean === korean))
    .filter((word): word is KoreanWord => Boolean(word));
  const syllableQuestions = lesson.category === "Hangul"
    ? lesson.words.flatMap((korean) => {
        const sample = hangulSyllableExamples.find((item) => item.korean === korean);
        if (!sample) return [];
        const note = `${sample.letters.join(" + ")} builds ${sample.korean}, read as ${sample.romanization}. This is a reading sample, not a word definition.`;
        const alternatives = hangulSyllableExamples.filter((item) => item.id !== sample.id);
        return [
          makeText(`syllable-recall-${lesson.id}-${sample.id}`, sample.korean, "Recall this syllable’s romanized sound.", sample.romanization, note, "Romanized syllable"),
          makeChoice(`syllable-choice-${lesson.id}-${sample.id}`, sample.letters.join(" + "), "Which block combines these letters?", sample.korean, shuffle(alternatives.map((item) => item.korean)).slice(0, 3), note),
          makeText(`syllable-build-${lesson.id}-${sample.id}`, sample.letters.join(" + "), "Write the Hangul block formed by these letters.", sample.korean, note, "One Hangul block"),
        ];
      })
    : [];
  const wordQuestions = words.flatMap((word, index) => {
    const distractors = words.filter((item) => item.korean !== word.korean);
    const syllables = Array.from(word.korean).filter((letter) => /[가-힣]/.test(letter));
    const sampleSyllable = word.category === "Hangul" ? word.example : syllables[0] ?? word.korean;
    const note = word.category === "Hangul"
      ? `${word.korean} is usually ${word.meaning}. A sample block is ${word.example}.`
      : `${word.korean} (${word.romanization}) means ${word.meaning}. Notice its first block: ${sampleSyllable}.`;

    if (word.category === "Hangul") {
      const otherLetters = hangulLetters
        .filter((letter) => letter.korean !== word.korean)
        .map((letter) => letter.korean);
      const otherSounds = hangulLetters
        .filter((letter) => letter.korean !== word.korean)
        .map((letter) => letter.meaning);
      const otherSamples = hangulLetters
        .filter((letter) => !hangulSyllableExamples.find((sample) => sample.korean === letter.example)?.letters.includes(word.korean))
        .map((letter) => letter.example);
      return [
        makeChoice(`letter-sound-${lesson.id}-${index}`, word.korean, "Which sound cue matches this letter?", word.meaning, shuffle(otherSounds).slice(0, 3), note),
        makeText(`letter-write-${lesson.id}-${index}`, word.korean, "Type the letter’s romanized name or sound.", word.romanization, note, "Romanized sound"),
        makeText(`letter-build-${lesson.id}-${index}`, word.korean, `Write the Hangul letter for “${word.meaning}”.`, word.korean, note, "Hangul letter"),
        makeChoice(`letter-find-${lesson.id}-${index}`, word.korean, `Which letter matches “${word.meaning}”?`, word.korean, shuffle(otherLetters).slice(0, 3), note),
        makeChoice(`letter-syllable-${lesson.id}-${index}`, word.korean, "Which example block includes this letter?", word.example, shuffle(otherSamples).slice(0, 3), note),
      ];
    }

    const distractorMeanings = shuffle(distractors.map((item) => item.meaning));
    const meaningAlternatives = word.meaning
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(1, 3);
    const answerNote = word.example
      ? `${note} In context: ${word.example}`
      : note;
    return [
      makeChoice(`word-choice-${lesson.id}-${index}`, word.korean, "Choose the closest meaning.", word.meaning, distractorMeanings, answerNote),
      makeText(`word-write-${lesson.id}-${index}`, word.korean, "Write the English meaning from memory.", word.meaning, answerNote, "Meaning in English", meaningAlternatives),
      makeText(`word-spell-${lesson.id}-${index}`, word.korean, "Write the Korean pronunciation in roman letters.", word.romanization, answerNote, "Romanized pronunciation"),
      makeText(`word-hangul-${lesson.id}-${index}`, word.korean, `Write “${word.meaning}” in Korean.`, word.korean, answerNote, "Your answer in Hangul"),
      makeChoice(`word-syllable-${lesson.id}-${index}`, word.korean, "Guess the first Hangul block.", sampleSyllable, shuffle(distractors.flatMap((item) => Array.from(item.korean).filter((letter) => /[가-힣]/.test(letter)))), answerNote),
    ];
  });
  return [...syllableQuestions, ...wordQuestions];
}

function prepareQuestions(lesson: Lesson) {
  const supplemental = generatedQuestions(lesson);
  const all = [...lesson.questions, ...supplemental];
  const quizEligible = all.filter(
    (question) => !lesson.practiceOnlyQuestionIds?.includes(question.id),
  );
  const quizByKorean = new Map<string, LessonQuestion[]>();
  for (const question of quizEligible) {
    const questions = quizByKorean.get(question.korean) ?? [];
    questions.push(question);
    quizByKorean.set(question.korean, questions);
  }
  const onePerItem = [...quizByKorean.values()].map(
    (questions) => shuffle(questions)[0],
  );
  const prepare = (items: LessonQuestion[]) =>
    items.map((question) =>
      question.type === "choice"
        ? { ...question, choices: shuffle(question.choices) }
        : question,
    );
  return {
    practice: prepare(lesson.generatedPracticeOnly
      ? [...lesson.questions, ...shuffle(supplemental)]
      : shuffle(all)),
    quiz: prepare(shuffle(onePerItem)),
  };
}

export function LessonModal({
  lesson,
  preferences,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  preferences: LearningPreferences;
  onClose: () => void;
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
          !question.id.startsWith("word-hangul-") && !question.id.startsWith("letter-build-") && /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(question.answer) && romanization &&
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
    ? Boolean(currentWord || currentSyllable) &&
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
        <div className="lesson-progress"><i style={{ transform: `scaleX(${Math.min(1, progress)})` }} /></div>

        {phase === "briefing" && lesson.briefing ? (
          <div className="lesson-briefing">
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
                <button type="button" className="button button-quiet lesson-briefing-listen" onClick={() => { if (lesson.briefing) speakKorean(lesson.briefing.example); }}><SpeakerHigh size={16} /> Hear Korean · 1.00×</button>
                <button type="button" className="button button-quiet lesson-briefing-listen lesson-slow-listen" onClick={() => { if (lesson.briefing) speakKorean(lesson.briefing.example, { rate: 0.75 }); }}>Slower · 0.75×</button>
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
          <div className="lesson-complete">
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
          <div className="lesson-complete">
            <SoriMascot className="lesson-complete-mascot" />
            <div className="complete-stamp"><Check size={30} weight="bold" /></div>
            <span className="micro-label">LESSON COMPLETE</span>
            <h2 id="lesson-title">You finished<br /><em>{lesson.title}.</em></h2>
            <p>Final quiz: {quizCorrect} of {sets.quiz.length}. Your lesson words are added to spaced review.</p>
            <button className="button button-dark" onClick={() => onComplete(lesson, { correct: quizCorrect, total: sets.quiz.length })}>
              Finish this lesson <ArrowRight size={17} />
            </button>
          </div>
        ) : question ? (
          <div className="lesson-question">
            <span className="question-count">
              {phase === "practice" ? "PRACTICE" : "QUIZ"} {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
            </span>
            <div className="letter-stage"><span lang="ko">{!speechPracticeTurn && (question.id.startsWith("word-hangul-") || question.id.startsWith("letter-build-")) ? "?" : question.korean}</span></div>
            <WordReference word={question.korean} source={currentWord?.source} license={currentWord?.license} reviewStatus={currentWord?.reviewStatus} />
            <div className="lesson-audio-actions">
              <button type="button" className="lesson-listen-button" aria-label="Hear this Korean phrase at the selected pace" onClick={() => speakKorean(question.korean)}><SpeakerHigh size={17} weight="fill" /><span>Listen · {preferences.speechPace.toFixed(2)}×</span></button>
              <button type="button" className="lesson-listen-button lesson-slow-listen" aria-label="Hear this Korean phrase more slowly" onClick={() => speakKorean(question.korean, { rate: 0.75 })}>Slower · 0.75×</button>
            </div>
            {preferences.romanization && romanization && !question.id.startsWith("word-hangul-") && !question.id.startsWith("letter-build-") && (showTip || (phase !== "quiz" && !romanizationRevealsAnswer)) && (
              <p className="lesson-romanization" lang="ko-Latn">{romanization}</p>
            )}
            <h2 id="lesson-title">{speechPracticeTurn ? "Say this Korean aloud." : question.prompt}</h2>
            {speechPracticeTurn ? <>
              <OpenRouterListeningPractice
                key={`${phase}-${question.id}`}
                variant="lesson-speaking"
                korean={question.korean}
                expectedRomanization={romanization}
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
        <div className="modal-bottom">
          <span>Learn at your own pace. Switch to writing whenever you need to.</span>
          <span className="modal-free"><i /> 100% free</span>
        </div>
      </section>
    </div>
  );
}
