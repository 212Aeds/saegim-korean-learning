import type { PracticeCard } from "../practice-bank";
import { WordReference } from "./word-reference";

export function PracticeMistakes({cards,audioBusy,onListen}: {cards: PracticeCard[];audioBusy: boolean;onListen:(text:string)=>void}) {
  if (!cards.length) return null;
  return <details className="practice-mistakes">
    <summary>Review {cards.length} tricky {cards.length===1 ? "question" : "questions"} from this round</summary>
    <p>These needed another try. Read the answer, listen when useful, then repeat them below.</p>
    <ol>{cards.map(card=><li key={card.question.id}>
      <span className="micro-label">{card.listening ? "LISTENING" : "RECALL"}</span>
      <h3 lang="ko">{card.reference}</h3><p>{card.question.prompt}</p>
      <p className="practice-recall-answer"><span>Target answer</span><strong>{card.question.answer}</strong></p>
      <p>{card.question.tip}</p>
      {!card.question.id.startsWith("drill-shape-") && <button type="button" className="button button-quiet" disabled={audioBusy} onClick={()=>onListen(card.reference)}>Listen again</button>}
      <WordReference word={card.reference} readingSample={card.readingSample}/>
    </li>)}</ol>
  </details>;
}
