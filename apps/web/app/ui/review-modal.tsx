"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, X } from "./icons";
import type { ReviewItem } from "../progress";
import { reviewSession } from "./review-session";
import { useDialogFocus } from "./use-dialog-focus";
import { playCorrectAnswerSound } from "./feedback-sound";
import { FeedbackToggle } from "./feedback-toggle";
import { FlipCard } from "./flip-card";
import { speakKorean } from "./speech";
import { WordReference } from "./word-reference";
import { KoreanInput } from "./korean-keyboard";

export function ReviewModal({
  items,
  maxCards,
  onRate,
  onClose,
}: {
  items: ReviewItem[];
  maxCards?: number;
  onRate: (id: string, remembered: boolean) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogFocus(dialogRef, onClose);
  const [sessionItems, setSessionItems] = useState(() => reviewSession(items, maxCards));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [missedCards, setMissedCards] = useState<ReviewItem[]>([]);
  const [recall, setRecall] = useState("");
  const card = sessionItems[index];

  function finishCard(remembered: boolean) {
    if (!card) return;
    onRate(card.id, remembered);
    if (remembered) setRememberedCount((count) => count + 1);
    else setMissedCards((cards) => [...cards, card]);
    setIndex((current) => current + 1);
    setRevealed(false);
    setRecall("");
  }

  if (!card) {
    if (sessionItems.length) return <div className="modal-backdrop"><section ref={dialogRef} className="lesson-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title"><button className="modal-close" onClick={onClose} aria-label="Close review"><X size={20} /></button><div className="review-question"><span className="micro-label">REVIEW ROUND COMPLETE</span><h2 id="review-title">A little recall, a little stronger.</h2><div className="review-summary"><strong>{sessionItems.length}<span>cards practiced</span></strong><strong>{rememberedCount}<span>marked remembered</span></strong><strong>{missedCards.length}<span>to revisit</span></strong></div><p>Remembered cards return later. Cards marked Again stay in your recovery practice. A second pass is optional; taking a break is useful too.</p><div className="answer-actions">{missedCards.length > 0 && <button type="button" className="button button-soft" onClick={() => { setSessionItems(reviewSession(missedCards)); setMissedCards([]); setIndex(0); setRememberedCount(0); setRevealed(false); setRecall(""); }}>Practice {missedCards.length} missed {missedCards.length === 1 ? "card" : "cards"} again</button>}<button type="button" className="button button-dark" onClick={onClose}>Back to my learning</button></div></div></section></div>;
    return (
      <div className="modal-backdrop" role="presentation">
        <section ref={dialogRef} className="lesson-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
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
        <div className="review-session-progress" role="progressbar" aria-label="Cards practiced" aria-valuemin={0} aria-valuemax={sessionItems.length} aria-valuenow={index}><i style={{ transform: `scaleX(${index / sessionItems.length})` }} /></div>
        <div className="review-question" key={card.id}>
          <h2 id="review-title" className="review-session-heading">Recall, reveal, remember.</h2>
          <FlipCard key={card.id} flipped={revealed} front={<div className="review-face-content">
            <span className="question-label">{card.question}</span><h3 lang="ko">{card.front}</h3>
            <p>Try to recall the answer before you turn this card over.</p>
          </div>} back={<div className="review-face-content">
            <span className="question-label">ANSWER</span><h3>{card.answer}</h3><p>{card.note}</p>
          </div>} />
          {!revealed && <details className="review-written-recall"><summary>Try writing your answer first</summary><KoreanInput value={recall} onChange={setRecall} label="Your recalled answer" placeholder="Your best guess — Korean or English" maxLength={300} openOnFocus={false} /><small>Compare with the card when you reveal it. Alternative wording may be valid; you choose your recall rating.</small></details>}
          {revealed && recall && <p className="review-your-answer"><strong>Your recall:</strong> {recall}</p>}
          <div className="flashcard-tools">
            <FeedbackToggle />
            <button className="button button-quiet" onClick={() => speakKorean(card.front)}>Listen to Korean</button>
            <button className="button button-soft" aria-pressed={revealed} onClick={() => setRevealed(!revealed)}>{revealed ? "Back to question" : "Reveal card"} <ArrowRight size={16} /></button>
          </div>
          {revealed && <><WordReference word={card.front} /><p className="recall-rating-hint">How did your recall feel? Your rating plans the next review.</p>
            <div className="answer-actions">
              <button className="button button-quiet" onClick={() => finishCard(false)}>{index === sessionItems.length - 1 ? "Again · finish" : "Again · keep in review"}</button>
              <button className="button button-dark" onClick={() => { playCorrectAnswerSound(); finishCard(true); }}>{index === sessionItems.length - 1 ? "Remembered · finish" : "I remembered"} <Check size={16} /></button>
            </div></>}
        </div>
        <div className="modal-bottom">
          <span>One card, one rating. You can revisit anything marked “Again.”</span>
          <span className="review-progress">{String(index + 1).padStart(2, "0")} <i /> {String(sessionItems.length).padStart(2, "0")}</span>
        </div>
      </section>
    </div>
  );
}
