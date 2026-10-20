import {useGuestLearning} from "./guest-learning";
import { useRef } from "react";

const descriptions = {
  today: "Start here for your daily plan and next lesson.",
  learn: "Follow lessons that build on your Korean level.",
  practice: "Mix question types and strengthen what you know.",
  review: "Revisit flashcards when they are ready to practice.",
  words: "Browse vocabulary, meanings, and pronunciation.",
  speak: "Listen to useful phrases, then try saying them.",
  tutor: "Ask a question or practice a conversation.",
};
type Destination = keyof typeof descriptions;

export function FeatureGuide({sections,onNavigate,onSettings}: {
  sections: {id:Destination;label:string}[];
  onNavigate:(destination:Destination)=>void;
  onSettings:()=>void;
}) {
  const guest=useGuestLearning();
  const panel = useRef<HTMLDetailsElement>(null);
  function close() {
    if (panel.current) {
      panel.current.open = false;
      panel.current.querySelector("summary")?.focus();
    }
  }
  return <details className="feature-guide" ref={panel}>
    <summary>Find your next step <span>A quick guide to Saegim</span></summary>
    <p className="feature-guide-intro">A simple routine: choose your next lesson, learn one small thing, then revisit it tomorrow. Your level and goals stay changeable in Settings.</p>
    {guest && <p>You can finish lessons and practice without an email. Guest progress stays in this browser; clearing site data can erase it. An account is optional for syncing, AI and speech recognition.</p>}
    <nav className="feature-guide-links" aria-label="Feature guide">
      {sections.filter(section=>["today","learn","review"].includes(section.id)).map(section=><button key={section.id} type="button" onClick={()=>{close();onNavigate(section.id);}}>
        <strong>{section.label}</strong><span>{descriptions[section.id]}</span>
      </button>)}
    </nav>
    <details className="guide-more"><summary>More ways to practice</summary><nav className="feature-guide-links" aria-label="More practice tools">{sections.filter(section=>!["today","learn","review"].includes(section.id)).map(section=><button key={section.id} type="button" onClick={()=>{close();onNavigate(section.id);}}><strong>{section.label}</strong><span>{descriptions[section.id]}</span></button>)}</nav></details>
    <details className="guide-more"><summary>Help with phrases or speaking</summary><p>In Speak, open Browse phrases and search a word or topic, such as food, son, or hello. Results stay within your current level and unlocked material.</p><p>{guest ? "In guest practice, listen, say the phrase to yourself, then check a written Korean or romanized answer. No microphone upload is needed." : "Listen first, then tap Speak. The pause begins after your last words: choose 3, 5, or 10 seconds, or tap Stop & check to send immediately. If your microphone is unavailable, open Prefer to write."}</p><p>{guest ? "For AI conversation and speech recognition, open AI Tutor to find the optional account setup. Your other practice tools stay available without an account." : "For a conversation, choose AI Tutor, then Conversation. Pick a situation or describe your own. You can type throughout and turn spoken replies on or off."}</p></details>
    <button type="button" className="feature-guide-settings" onClick={()=>{close();onSettings();}}>Change your level, goals, or audio in Settings</button>
  </details>;
}
