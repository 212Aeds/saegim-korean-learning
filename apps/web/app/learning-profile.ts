import { coreLetterLessonIds } from "./foundation-lessons";
import { lessons } from "./curriculum";
import { isLessonUnlocked } from "./learning-pathways";
export type LearningProfile = { level: "new" | "hangul" | "basic" | "intermediate"; reasons: Array<"family" | "travel" | "culture" | "work-study">; avatar?: "sprout" | "cat" | "star" | "moon"; weeklyGoal?: 3 | 5 | 7 };
export const defaultLearningProfile: LearningProfile = { level: "new", reasons: ["culture"] };
// Self-reported placement opens an entry point; it never awards completion or XP.
export function placementKnowledge(profile = defaultLearningProfile) {
  if (profile.level === "new") return [];
  const hangul = lessons.filter((lesson) => lesson.category === "Hangul").map((lesson) => lesson.id);
  if (profile.level === "hangul") return hangul;
  const basic = ["hello-there", "introductions", "sentence-order", "sentence-particles", "polite-present", "count-to-ten"];
  return profile.level === "basic" ? [...hangul, ...basic] : [...hangul, ...basic, "at-the-cafe", "ask-a-question", "polite-past", "plans-and-intentions", "connect-with-go"];
}
export function learningRoute(profile = defaultLearningProfile) {
  const foundations = profile.level === "new"
    ? ["hangul-first-sounds", ...coreLetterLessonIds, "hangul-more-sounds", "build-a-syllable", "hangul-syllable-blocks", "hangul-batchim", "first-readable-words", "hello-there", "introductions", "sentence-order"]
    : profile.level === "hangul" ? ["hello-there", "family-and-friends", "at-the-cafe", "introductions", "sentence-order"]
    : profile.level === "basic" ? ["at-the-cafe", "shopping-prices", "everyday-actions", "ask-a-question"]
    : ["conversation-weekend", "conversation-cafe", "conversation-plans", "descriptive-comparisons", "stretch-sentence-lab"];
  const interests = profile.reasons.flatMap((reason) => reason === "travel"
    ? ["at-the-cafe", "ask-a-question", "shopping-prices", "places-around-you", "travel-find-places", "give-directions"]
    : reason === "family" ? ["family-and-friends", "family-short-introductions", "hello-there", "time-and-routine"]
    : reason === "work-study" ? ["time-and-routine", "time-expressions", "polite-requests", "plans-and-intentions"]
    : ["hobbies-and-free-time", "describe-things", "weather-and-feelings"]);
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const assumed = new Set(placementKnowledge(profile));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const route: typeof lessons = [];
  function visit(id: string) {
    if (visited.has(id) || !byId.has(id)) return;
    if (visiting.has(id)) throw new Error(`Circular lesson prerequisites: ${id}`);
    visiting.add(id);
    const lesson = byId.get(id)!;
    for (const prerequisite of lesson.prerequisiteLessonIds ?? []) if (!assumed.has(prerequisite)) visit(prerequisite);
    visiting.delete(id); visited.add(id); route.push(lesson);
  }
  [...foundations, ...interests, ...lessons.map((lesson) => lesson.id)].forEach(visit);
  return route;
}
export function recommendedLessons(completed: string[], profile = defaultLearningProfile) {
  return learningRoute(profile).filter((lesson) => !completed.includes(lesson.id) && !placementKnowledge(profile).includes(lesson.id) && isLessonUnlocked(lesson, completed, placementKnowledge(profile)));
}
