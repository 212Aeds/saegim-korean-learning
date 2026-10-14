import type { LearningProfile } from "../learning-profile";

export const levelFocus = {
  new: { title: "Letters first", detail: "Recognize Hangul shapes and sounds, then build readable blocks." },
  hangul: { title: "From letters to words", detail: "Read short words and connect each one with its meaning before building sentences." },
  basic: { title: "Useful words, one at a time", detail: "Build vocabulary for food, home, and getting around. Sentence patterns come next, followed by short exchanges." },
  intermediate: { title: "Everyday conversations", detail: "Use familiar words in complete replies, follow-up questions, and everyday situations." },
  advanced: { title: "Ideas and connected replies", detail: "Explain opinions, connect ideas, and practice longer exchanges." },
};

export function LevelFocus({profile}: {profile: LearningProfile}) {
  const focus = levelFocus[profile.level];
  return <section className="level-focus" aria-label="Your current learning focus">
    <span className="micro-label">YOUR LEARNING FOCUS</span>
    <h3>{focus.title}</h3><p>{focus.detail}</p>
    <small>Change your starting level in Settings. Completed lessons stay saved.</small>
  </section>;
}
