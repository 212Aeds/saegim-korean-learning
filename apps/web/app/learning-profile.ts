import { coreLetterLessonIds } from "./foundation-lessons";
import { lessons } from "./curriculum";
import { isLessonUnlocked } from "./learning-pathways";
export type LearningProfile = { level: "new" | "hangul" | "basic" | "intermediate" | "advanced"; reasons: Array<"family" | "travel" | "culture" | "work-study" | "friends" | "food" | "living" | "exams">; avatar?: "sprout" | "cat" | "star" | "moon"; weeklyGoal?: 3 | 5 | 7; dailyMinutes?: 5 | 10 | 15 | 20 | 30 | 45 | 60; onboardingCompleted?: boolean };
export const defaultLearningProfile: LearningProfile = { level: "new", reasons: ["culture"] };
// Self-reported placement opens an entry point; it never awards completion or XP.
export function placementKnowledge(profile = defaultLearningProfile) {
  if (profile.level === "new") return [];
  const hangul = lessons.filter((lesson) => lesson.category === "Hangul").map((lesson) => lesson.id);
  if (profile.level === "hangul") return hangul;
  const basic = ["hello-there", "introductions", "sentence-order", "sentence-particles", "polite-present", "count-to-ten"];
  if(profile.level === "advanced") return [...hangul,...lessons.filter(lesson=>lesson.pathwayId === "grammar" || lesson.level === "foundation" || lesson.level === "intermediate").map(lesson=>lesson.id)];
  return profile.level === "basic" ? [...hangul, "hello-there"] : [...hangul, ...basic, "at-the-cafe", "ask-a-question", "polite-past", "plans-and-intentions", "connect-with-go"];
}
export function learningRoute(profile = defaultLearningProfile) {
  const foundations = profile.level === "new"
    ? ["hangul-first-sounds", ...coreLetterLessonIds, "hangul-more-sounds", "build-a-syllable", "hangul-syllable-blocks", "hangul-batchim", "first-readable-words", "hello-there", "introductions", "sentence-order"]
    : profile.level === "hangul" ? ["first-readable-words", "hello-there", "food-words", "home-words", "introductions", "sentence-order"]
    : profile.level === "basic" ? ["food-words", "home-words", "transport-words", "introductions", "sentence-order", "sentence-particles", "polite-present", "at-the-cafe"]
    : profile.level === "advanced" ? ["opinions-dialogue", "work-dialogue", "study-dialogue", "mixed-conversation-lab"] : ["conversation-weekend", "conversation-cafe", "conversation-plans", "descriptive-comparisons", "stretch-sentence-lab"];
  const interests = profile.reasons.flatMap((reason) => reason === "food" ? ["food-words","food-dialogue","at-the-cafe"] : reason === "living" ? ["home-words","home-dialogue","calendar-words","calendar-dialogue","neighborhood-words","health-words","health-dialogue","transport-words"] : reason === "friends" ? ["messages-words","messages-dialogue","meetups-words","meetups-dialogue","hobbies-words","hobbies-dialogue","family-and-friends"] : reason === "exams" ? ["study-words","study-dialogue","time-and-routine"] : reason === "travel"
    ? ["stay-words", "stay-dialogue", "clothes-words", "clothes-dialogue", "transport-words", "transport-dialogue", "at-the-cafe", "ask-a-question", "shopping-prices", "places-around-you", "travel-find-places", "give-directions"]
    : reason === "family" ? ["family-and-friends", "family-short-introductions", "hello-there", "time-and-routine"]
    : reason === "work-study" ? ["calendar-words","calendar-dialogue","messages-words","messages-dialogue","work-words","work-dialogue","study-words","time-and-routine", "time-expressions", "polite-requests", "plans-and-intentions"]
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
  const withPractice = (ids: string[]) => ids.flatMap((id) => [id,
    ...(id === "hangul-round-vowels" ? ["checkpoint-vowels"] : id === "hangul-lips-consonants" ? ["checkpoint-consonants"] : id.endsWith("-dialogue") ? [id.replace(/-dialogue$/, "-consolidation")] : []),
  ]);
  [...withPractice(foundations), ...withPractice(interests), ...lessons.map((lesson) => lesson.id)].forEach(visit);
  return route;
}
export function recommendedLessons(completed: string[], profile = defaultLearningProfile) {
  return learningRoute(profile).filter((lesson) => !completed.includes(lesson.id) && !placementKnowledge(profile).includes(lesson.id) && isLessonUnlocked(lesson, completed, placementKnowledge(profile)));
}
