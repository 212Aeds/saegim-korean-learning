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
  const panel = useRef<HTMLDetailsElement>(null);
  function close() {
    if (panel.current) {
      panel.current.open = false;
      panel.current.querySelector("summary")?.focus();
    }
  }
  return <details className="feature-guide" ref={panel}>
    <summary>Find your next step <span>A quick guide to Saegim</span></summary>
    <p className="feature-guide-intro">Start with Today. Follow Learn for new material, then use Review to help it stick. Explore the other tools whenever you like.</p>
    <nav className="feature-guide-links" aria-label="Feature guide">
      {sections.map(section=><button key={section.id} type="button" onClick={()=>{close();onNavigate(section.id);}}>
        <strong>{section.label}</strong><span>{descriptions[section.id]}</span>
      </button>)}
    </nav>
    <button type="button" className="feature-guide-settings" onClick={()=>{close();onSettings();}}>Change your level, goals, or audio in Settings</button>
  </details>;
}
