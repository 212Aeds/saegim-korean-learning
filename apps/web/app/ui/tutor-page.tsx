"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Sparkle } from "./icons";
import { SoriMascot } from "./sori-mascot";
import { defaultLearningProfile, type LearningProfile } from "../learning-profile";

type TutorAnswer = { explanation: string; hint: string; nextExercise: string };
type TutorState = "idle" | "thinking" | "error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const starters = [
  "When do I use 은/는 and 이/가?",
  "How do I make a polite request?",
  "Why does the verb come last?",
  "How do 에 and 에서 differ?",
];

export function TutorPage({ learningProfile = defaultLearningProfile }: { learningProfile?: LearningProfile }) {
  const suggestedStarters = learningProfile.level === "new" ? ["How do I build a Hangul syllable?", "What is the difference between ㅓ and ㅗ?", "How do I introduce myself politely?", "Help me remember a new Korean word."] : learningProfile.level === "intermediate" ? ["How do I connect two Korean actions with -고?", "Explain -(으)ㄹ 거예요 with examples.", "When does 은/는 express contrast?", "Give me a short everyday dialogue to practice."] : starters;
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<TutorState>("idle");
  const [notice, setNotice] = useState("");
  const [answer, setAnswer] = useState<{ question: string; content: TutorAnswer } | null>(null);

  async function ask(event?: FormEvent<HTMLFormElement>, suggestedQuestion = question) {
    event?.preventDefault();
    const clean = suggestedQuestion.trim().replace(/\s+/gu, " ").slice(0, 600);
    if (!clean || state === "thinking") return;
    if (!apiUrl) {
      setState("error");
      setNotice("Saegim’s tutor service is not connected right now. Try again later.");
      return;
    }
    setQuestion(clean);
    setAnswer(null);
    setNotice("");
    setState("thinking");
    try {
      const response = await fetch(`${apiUrl}/v1/tutor/answer`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: clean,
          lessonId: "general-korean-tutor",
          lessonContext: `This is a Korean-learning question. Learner's self-reported starting level: ${learningProfile.level}. Goals: ${learningProfile.reasons.join(", ")}. Tailor difficulty to this level, treating it as self-assessment rather than a tested ability. Explain Korean grammar, vocabulary, writing, pronunciation, or usage with a short example and practice prompt. Keep examples accurate; distinguish pronunciation guides from exact sounds.`,
          consent: true,
        }),
        signal: AbortSignal.timeout(65_000),
      });
      if (!response.ok) {
        if (response.status === 429) {
          const body = await response.json().catch(() => null) as { message?: unknown } | null;
          throw new Error(typeof body?.message === "string" ? body.message : "Saegim’s Tutor is busy right now. Please try again a little later.");
        }
        if (response.status === 401) throw new Error("Please sign in again to use the tutor.");
        if (response.status === 503) throw new Error("Saegim’s Tutor is temporarily unavailable. Your question is still here; please try again.");
        throw new Error("Saegim’s tutor could not answer right now. Your question is still here; please try again.");
      }
      const value = await response.json() as Partial<TutorAnswer>;
      if (typeof value.explanation !== "string" || typeof value.hint !== "string" || typeof value.nextExercise !== "string") {
        throw new Error("Saegim’s tutor returned an incomplete answer. Please try again.");
      }
      setAnswer({ question: clean, content: { explanation: value.explanation, hint: value.hint, nextExercise: value.nextExercise } });
      setState("idle");
    } catch (error) {
      setState("error");
      setNotice(error instanceof Error ? error.message : "Saegim’s tutor could not answer right now.");
    }
  }

  return (
    <div className="tutor-page">
      <section className="tutor-chat-card" aria-labelledby="tutor-title">
        <div className="tutor-chat-heading">
          <SoriMascot className={`tutor-chat-mascot ${state === "thinking" ? "is-thinking" : ""}`} />
          <div>
            <span className="micro-label"><Sparkle size={14} /> YOUR KOREAN TUTOR</span>
            <h2 id="tutor-title">Ask Saegim anything<br />about Korean.</h2>
            <p>A focused tutor for grammar, words, writing, pronunciation, and when to use a phrase. No model download or speaking practice in this section.</p>
          </div>
        </div>

        <form className="tutor-ask-form" onSubmit={(event) => void ask(event)}>
          {state === "thinking" ? (
            <div className="tutor-prompt-thinking" role="status" aria-live="polite" aria-busy="true">
              <SoriMascot className="tutor-thinking-mascot" />
              <div><strong>Saegim is thinking</strong><span>Finding a clear explanation and a useful example…</span></div>
              <i aria-hidden="true" />
            </div>
          ) : (
            <>
              <label className="tutor-question-select">
                <span>Your question</span>
                <textarea value={question} onChange={(event) => { setQuestion(event.target.value); setAnswer(null); setNotice(""); }} maxLength={600} rows={4} placeholder="Why does this sentence use 은 instead of 이?" />
              </label>
              <button type="submit" className="button button-dark" disabled={!question.trim()}>
                Ask Saegim <ArrowRight size={17} />
              </button>
            </>
          )}
        </form>

        <div className="tutor-starter-questions" aria-label="Suggested questions">
          <span className="micro-label">TRY ASKING</span>
          {suggestedStarters.map((item) => <button type="button" key={item} disabled={state === "thinking"} onClick={() => { setQuestion(item); void ask(undefined, item); }}>{item}</button>)}
        </div>
        {notice && <p className={`tutor-service-message ${state === "error" ? "is-error" : ""}`} role="status">{notice}</p>}
        {answer && (
          <article className="tutor-help-answer" aria-live="polite">
            <SoriMascot className="tutor-answer-mascot" />
            <div>
              <span className="micro-label">YOUR TUTOR</span>
              <h3>{answer.question}</h3>
              <p>{answer.content.explanation}</p>
              <div className="tutor-answer-extra">
                <p><strong>A helpful hint</strong><span>{answer.content.hint}</span></p>
                <p><strong>Try this</strong><span>{answer.content.nextExercise}</span></p>
              </div>
            </div>
          </article>
        )}
        <p className="tutor-boundary-note">Saegim’s answers are AI-generated and can make mistakes. Korean examples are generated from the question context; check subtle usage with a trusted teacher when it matters.</p>
      </section>
    </div>
  );
}
