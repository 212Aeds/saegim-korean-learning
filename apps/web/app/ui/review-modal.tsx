"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, X } from "./icons";
import type { ReviewItem } from "../progress";
import { deduplicateReviewItems } from "../progress";
import { shuffle } from "../curriculum";
import { useDialogFocus } from "./use-dialog-focus";
import { playCorrectAnswerSound } from "./feedback-sound";

export function ReviewModal({
  items,
  onRate,
  onClose,
}: {
  items: ReviewItem[];
  onRate: (id: string, remembered: boolean) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogFocus(dialogRef, onClose);
  const [sessionItems] = useState(() => shuffle(deduplicateReviewItems(items)));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = sessionItems[index];

  function finishCard(remembered: boolean) {
    if (!card) return;
    onRate(card.id, remembered);
    if (index >= sessionItems.length - 1) {
      onClose();
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(false);
  }

  if (!card) {
    return (
      <div className="modal-backdrop" role="presentation">
        <section className="lesson-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <button className="modal-close" onClick={onClose} aria-label="Close review"><X size={20} /></button>
          <div className="review-question">
            <span className="question-label">ALL CAUGHT UP</span>
            <h2 id="review-title">Nothing due right now.</h2>
            <p>Finish another lesson and new flashcards will join your review.</p>
            <button className="button button-dark" onClick={onClose}>Done</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="lesson-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <div className="modal-top">
          <span className="micro-label">FLASHCARD · {String(index + 1).padStart(2, "0")} OF {String(sessionItems.length).padStart(2, "0")}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close review"><X size={20} /></button>
        </div>
        <div className="review-question">
          <span className="question-label">{revealed ? "ANSWER" : card.question}</span>
          <h2 id="review-title" lang="ko">{revealed ? card.answer : card.front}</h2>
          {revealed ? (
            <>
              <p>{card.note}</p>
              <div className="answer-actions">
                <button className="button button-quiet" onClick={() => finishCard(false)}>{index === sessionItems.length - 1 ? "Again · finish" : "Again · keep in review"}</button>
                <button className="button button-dark" onClick={() => { playCorrectAnswerSound(); finishCard(true); }}>{index === sessionItems.length - 1 ? "Remembered · finish" : "I remembered"} <Check size={16} /></button>
              </div>
            </>
          ) : (
            <>
              <p>Try to recall the answer before you turn this card over.</p>
              <button className="button button-dark" onClick={() => setRevealed(true)}>Reveal card <ArrowRight size={16} /></button>
            </>
          )}
        </div>
        <div className="modal-bottom">
          <span>One card, one rating. You can revisit anything marked “Again.”</span>
          <span className="review-progress">{String(index + 1).padStart(2, "0")} <i /> {String(sessionItems.length).padStart(2, "0")}</span>
        </div>
      </section>
    </div>
  );
}
