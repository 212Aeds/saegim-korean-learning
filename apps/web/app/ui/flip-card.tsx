import type { ReactNode } from "react";

export function FlipCard({ flipped, front, back }: { flipped: boolean; front: ReactNode; back: ReactNode }) {
  return <div className="flip-card"><div className={`flip-card-inner ${flipped ? "is-turned" : ""}`}>
    <div className="flip-card-face" aria-hidden={flipped} inert={flipped}>{front}</div>
    <div className="flip-card-face flip-card-back" aria-hidden={!flipped} inert={!flipped}>{back}</div>
  </div></div>;
}
