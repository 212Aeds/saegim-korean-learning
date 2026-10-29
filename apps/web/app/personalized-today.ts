import { recommendedLessons, type LearningProfile } from "./learning-profile";

const guidance: Record<LearningProfile["level"], { levelLabel: string; guidance: string }> = {
  new: { levelLabel: "Starting with Hangul", guidance: "Build letter and sound knowledge before moving into words and sentences." },
  hangul: { levelLabel: "Building first words", guidance: "Use the Hangul you know to read useful words and build short expressions." },
  basic: { levelLabel: "Connecting words", guidance: "Grow your vocabulary and use sentence patterns to express more." },
  intermediate: { levelLabel: "Everyday conversations", guidance: "Connect sentences and practice responding in everyday situations." },
  advanced: { levelLabel: "Expressing more", guidance: "Practice explaining opinions and responding in longer exchanges." },
};

export function personalizedToday(profile: LearningProfile, completed: string[]) {
  const eligible = recommendedLessons(completed, profile);
  return {
    ...guidance[profile.level],
    interests: profile.reasons.map(reason => reason === "work-study" ? "work & study" : reason).join(", "),
    next: eligible[0] ?? null,
    alternatives: eligible.slice(1, 3),
  };
}
