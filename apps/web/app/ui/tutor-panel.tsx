"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "./icons";

type TutorAnswer = {
  explanation: string;
  hint: string;
  nextExercise: string;
};

type TutorState = "idle" | "loading" | "unavailable" | "limit" | "error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function isTutorAnswer(value: unknown): value is TutorAnswer {
  if (!value || typeof value !== "object") return false;
  return ["explanation", "hint", "nextExercise"].every((key) => {
    const text = (value as Record<string, unknown>)[key];
    return typeof text === "string" && text.trim().length > 0 && text.length <= 500;
  });
}

export function TutorPanel({ lessonId, context, curatedHint }: {
  lessonId: string;
  context: string;
  curatedHint: string;
}) {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<TutorAnswer | null>(null);
  const [state, setState] = useState<TutorState>("idle");
  const requestRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function clearRequest() {
    requestId.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
  }

  function close() {
    clearRequest();
    setOpen(false);
    setConsented(false);
    setQuestion("");
    setAnswer(null);
    setState("idle");
    openButtonRef.current?.focus();
  }

  useEffect(() => {
    return () => {
      requestId.current += 1;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    clearRequest();
    setOpen(false);
    setConsented(false);
    setQuestion("");
    setAnswer(null);
    setState("idle");
  }, [lessonId, context]);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  async function ask() {
    const cleanQuestion = question.trim().replace(/\s+/gu, " ");
    const lessonContext = context.trim().replace(/\s+/gu, " ").slice(0, 2_000);
    if (!consented || !cleanQuestion || cleanQuestion.length > 600 || !lessonContext || state === "loading") return;
    clearRequest();
    setAnswer(null);
    setState("loading");
    if (!apiUrl) {
      setState("unavailable");
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    const activeRequest = requestId.current;
    try {
      const response = await fetch(`${apiUrl}/v1/tutor/answer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, lessonId, lessonContext, consent: true }),
        signal: controller.signal,
      });
      if (activeRequest !== requestId.current) return;
      if (response.status === 429) {
        setState("limit");
      } else if (!response.ok) {
        setState(response.status === 503 ? "unavailable" : "error");
      } else {
        const result: unknown = await response.json();
        if (activeRequest !== requestId.current) return;
        if (isTutorAnswer(result)) {
          setAnswer(result);
          setState("idle");
        } else {
          setState("error");
        }
      }
    } catch {
      if (activeRequest === requestId.current && !controller.signal.aborted) setState("error");
    } finally {
      if (activeRequest === requestId.current) requestRef.current = null;
    }
  }

  return (
    <aside className="tutor-panel" aria-label="Korean tutor">
      {!open ? (
        <button ref={openButtonRef} type="button" className="tutor-entry" onClick={() => setOpen(true)}>
          Ask your Korean tutor <ArrowRight size={15} aria-hidden="true" />
        </button>
      ) : (
        <div className="tutor-content">
          <div className="tutor-heading">
            <div>
              <span className="micro-label">A LITTLE HELP</span>
              <h3>Ask your Korean tutor</h3>
            </div>
            <button ref={closeButtonRef} type="button" className="tutor-close" onClick={close} aria-label="Close tutor and clear question"><X size={18} /></button>
          </div>
          <div className="tutor-curated">
            <span className="micro-label">LESSON HINT</span>
            <p>{curatedHint}</p>
          </div>
          <p className="tutor-consent-copy">Your question and lesson context go to the configured tutor service. In local mode, the model runs on your laptop. Saegim does not save this conversation.</p>
          <label className="tutor-consent">
            <input type="checkbox" checked={consented} onChange={(event) => {
              if (!event.target.checked) {
                clearRequest();
                setAnswer(null);
                setState("idle");
              }
              setConsented(event.target.checked);
            }} />
            <span>Use my question and this lesson context to generate a tutor answer.</span>
          </label>
          <label className="tutor-question">
            <span>Your question</span>
            <textarea value={question} onChange={(event) => { clearRequest(); setQuestion(event.target.value); setAnswer(null); setState("idle"); }} maxLength={600} rows={3} placeholder="Why is this particle used here?" />
          </label>
          <div className="tutor-actions">
            <button type="button" className="button button-dark" disabled={!consented || !question.trim() || state === "loading"} aria-busy={state === "loading"} onClick={() => void ask()}>{state === "loading" ? "Asking…" : "Ask tutor"}</button>
            <button type="button" className="button button-quiet" onClick={close}>Not now</button>
          </div>
          <div className="tutor-status" role="status" aria-live="polite">
            {state === "loading" && "Finding a short explanation…"}
            {state === "limit" && "The tutor has reached today’s limit. The lesson hint is still here."}
            {state === "unavailable" && "The tutor is unavailable right now. Use the lesson hint above."}
            {state === "error" && "The tutor couldn’t answer. Try again or use the lesson hint above."}
            {answer && "Tutor answer ready. Explanation, hint, and a next exercise appear below."}
          </div>
          {answer && (
            <div className="tutor-answer" aria-label="Tutor answer">
              <p><strong>Explanation</strong>{answer.explanation}</p>
              <p><strong>Hint</strong>{answer.hint}</p>
              <p><strong>Try next</strong>{answer.nextExercise}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
