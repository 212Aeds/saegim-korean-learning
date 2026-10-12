"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "./icons";
import { speakingCards } from "../speak-cards";
import type { LearningPreferences } from "../progress";
import { OpenRouterListeningPractice } from "./openrouter-listening-practice";
import type { ElevenLabsVoice } from "./speech";

function firstUncompletedCard(completedIds: string[]) {
  return speakingCards.find((item) => !completedIds.includes(item.id)) ?? speakingCards[0];
}

function cardForCursor(currentCardId: string | null, completedIds: string[]) {
  const cursorCard = speakingCards.find((item) => item.id === currentCardId);
  return cursorCard ?? firstUncompletedCard(completedIds);
}

function nextUncompletedCard(currentId: string, completedIds: string[]) {
  const currentIndex = speakingCards.findIndex((item) => item.id === currentId);
  for (let step = 1; step <= speakingCards.length; step += 1) {
    const candidate = speakingCards[(currentIndex + step + speakingCards.length) % speakingCards.length];
    if (!completedIds.includes(candidate.id)) return candidate;
  }
  return speakingCards[0];
}

export function SpeakDeck({
  completedIds,
  currentCardId,
  onNavigate,
  onComplete,
  preferences,
  onPreferencesChange,
}: {
  completedIds: string[];
  currentCardId: string | null;
  onNavigate: (cardId: string) => void;
  onComplete: (completedId: string, nextCardId: string) => void;
  preferences: LearningPreferences;
  onPreferencesChange: (preferences: LearningPreferences) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [completing, setCompleting] = useState(false);
  const completionInProgress = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const card = cardForCursor(currentCardId, completedIds);
  const index = speakingCards.findIndex((item) => item.id === card.id);
  const completed = completedIds.includes(card.id);

  useEffect(() => {
    if (currentCardId !== card.id) onNavigate(card.id);
  }, [card.id, currentCardId, onNavigate]);

  useEffect(() => {
    completionInProgress.current = false;
    setCompleting(false);
    return () => {
      if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
      completionTimer.current = null;
    };
  }, [card.id]);

  function move(direction: -1 | 1) {
    if (completionInProgress.current) return;
    const currentIndex = speakingCards.findIndex((item) => item.id === card.id);
    for (let step = 1; step <= speakingCards.length; step += 1) {
      const candidate = speakingCards[(currentIndex + direction * step + speakingCards.length * 2) % speakingCards.length];
      if (!completedIds.includes(candidate.id) || completedIds.length >= speakingCards.length) {
        onNavigate(candidate.id);
        break;
      }
    }
    setFlipped(false);
  }

  function practiceCard() {
    if (completionInProgress.current || completed) return;
    completionInProgress.current = true;
    setCompleting(true);
    const next = nextUncompletedCard(card.id, [...new Set([...completedIds, card.id])]);
    const finishPractice = () => {
      completionTimer.current = null;
      setFlipped(false);
      setCompleting(false);
      completionInProgress.current = false;
      onComplete(card.id, next.id);
    };
    completionTimer.current = window.setTimeout(finishPractice, 400);
  }

  return (
    <div className={`speak-deck-page ${preferences.hangulSize === "large" ? "hangul-large" : ""}`}>
      <div className="speak-deck-heading">
        <div>
          <span className="micro-label">A SMALL SPEAKING PRACTICE</span>
          <h2>Say it, then notice why.</h2>
        </div>
        <div className="speak-deck-count">
          <strong>{completedIds.length}</strong><span> / {speakingCards.length} practiced</span>
        </div>
      </div>

      <div className={`speak-deck-progress ${completing ? "is-completing" : ""}`} aria-label={`${index + 1} of ${speakingCards.length}`}>
        <i style={{ transform: `scaleX(${(index + 1) / speakingCards.length})` }} />
      </div>
      <label className="phrase-picker">Choose a useful phrase<select value={card.id} disabled={completing} onChange={(event) => { setFlipped(false); onNavigate(event.target.value); }}>{speakingCards.map((phrase) => <option key={phrase.id} value={phrase.id}>{completedIds.includes(phrase.id) ? "✓ " : ""}{phrase.meaning}</option>)}</select></label>

      <article className={`speak-flashcard ${flipped ? "is-flipped" : ""}`}>
        <div className="speak-card-top">
          <span>{String(index + 1).padStart(2, "0")} <i /> {String(speakingCards.length).padStart(2, "0")}</span>
          <span className="speak-card-kind">{card.kind}</span>
        </div>
        <div className="speak-card-body">
          {!flipped ? (
            <>
              <span className="speak-card-prompt">{card.promptLabel}</span>
              <h3 lang="ko">{card.prompt}</h3>
              <p>{card.kind === "recall" ? "Say the Korean phrase aloud before you flip." : card.kind === "grammar" ? "Think of the example before you reveal the pattern." : "Take a breath. Say it out loud before you reveal the guide."}</p>
            </>
          ) : (
            <>
              <span className="speak-card-prompt">{card.grammarTitle}</span>
              <h3 lang="ko">{card.korean}</h3>
              {preferences.romanization && <span className="speak-card-roman">{card.romanization}</span>}
              <strong className="speak-card-meaning">{card.meaning}</strong>
              <div className="speak-grammar-tip">
                <span>GRAMMAR NOTE</span>
                <p>{card.grammarTip}</p>
              </div>
              <div className="speak-focus-word">
                <span>WORD TO NOTICE</span>
                <strong lang="ko">{card.focus}</strong>
                <small>{card.focusRomanization} · {card.focusMeaning}</small>
              </div>
            </>
          )}
        </div>
        <div className="speak-card-actions">
          <button className="button button-quiet" onClick={() => setFlipped((value) => !value)}>
            {flipped ? "Back to prompt" : "Flip for meaning & tip"}
          </button>
        </div>
        <OpenRouterListeningPractice
          key={card.id}
          korean={card.korean}
          english={card.meaning}
          onVoiceChange={(speechVoice: ElevenLabsVoice) => onPreferencesChange({ ...preferences, speechVoice })}
          onPaceChange={(speechPace) => onPreferencesChange({ ...preferences, speechPace })}
        />
        <div className="speak-deck-navigation">
          <button className="speak-arrow" onClick={() => move(-1)} aria-label="Previous speaking card"><ArrowLeft size={18} /></button>
          {completing ? (
            <button className="button button-soft speak-practiced" aria-live="polite" disabled>
              Practiced <Check size={17} />
            </button>
          ) : !completed ? (
            <button className="button button-dark" onClick={practiceCard}>
              I practiced this card <Check size={17} />
            </button>
          ) : (
            <button className="button button-soft" onClick={() => move(1)}>
              Practiced · Next card <ArrowRight size={17} />
            </button>
          )}
          <button className="speak-arrow" onClick={() => move(1)} aria-label="Next speaking card"><ArrowRight size={18} /></button>
        </div>
      </article>
      <p className="speak-deck-footnote">{speakingCards.length} distinct phrases · one card per concept · Review schedules cards for you · always free</p>
    </div>
  );
}
