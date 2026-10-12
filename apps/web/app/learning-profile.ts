import { lessons } from "./curriculum";
import { isLessonUnlocked, pathwayForLesson } from "./learning-pathways";
export type LearningProfile = { level: "new" | "hangul" | "basic" | "intermediate"; reasons: Array<"family" | "travel" | "culture" | "work-study"> };
export const defaultLearningProfile: LearningProfile = { level: "new", reasons: ["culture"] };
export function recommendedLessons(completed: string[], profile = defaultLearningProfile) {
  const preferred = profile.level === "new" ? "hangul" : profile.level === "hangul" ? "grammar" : "everyday";
  const topics = profile.reasons.flatMap((reason) => reason === "travel" ? ["travel", "café", "shopping", "direction", "restaurant", "price"] : reason === "family" ? ["family", "friends", "greet"] : reason === "work-study" ? ["school", "schedule", "polite", "time"] : ["music", "movie", "like", "hobbies"]);
  function score(lesson: typeof lessons[number]) {
    const text = `${lesson.title} ${lesson.detail}`.toLowerCase();
    return (pathwayForLesson(lesson) === preferred ? 10 : 0) + (profile.level === "intermediate" && lesson.level === "intermediate" ? 4 : 0) + topics.filter((topic) => text.includes(topic)).length * 3;
  }
  return lessons.filter((lesson) => !completed.includes(lesson.id) && isLessonUnlocked(lesson, completed)).sort((a, b) => score(b) - score(a));
}
