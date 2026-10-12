import { lessons, type Lesson } from "./curriculum";

export type LearningPathway = {
  id: "hangul" | "grammar" | "everyday" | "stretch";
  title: string;
  description: string;
  level: "foundation" | "intermediate" | "stretch";
};

export const learningPathways: LearningPathway[] = [
  {
    id: "hangul",
    title: "Hangul foundations",
    description: "Learn the letters, build syllable blocks, and read final consonants.",
    level: "foundation",
  },
  {
    id: "grammar",
    title: "Grammar in context",
    description: "See how Korean sentences fit together in everyday situations.",
    level: "foundation",
  },
  {
    id: "everyday",
    title: "Everyday Korean",
    description: "Grow useful words and put them into short, natural exchanges.",
    level: "intermediate",
  },
  {
    id: "stretch",
    title: "Stretch practice",
    description: "Retrieve foundation material across mixed prompts and sentence tasks.",
    level: "stretch",
  },
];

const knownLessonIds = new Set(lessons.map((lesson) => lesson.id));

export function pathwayForLesson(lesson: Lesson): LearningPathway["id"] {
  if (
    lesson.pathwayId === "hangul" ||
    lesson.pathwayId === "grammar" ||
    lesson.pathwayId === "everyday" ||
    lesson.pathwayId === "stretch"
  ) {
    return lesson.pathwayId;
  }
  if (lesson.category === "Hangul") return "hangul";
  if (lesson.category === "Grammar") return "grammar";
  if (lesson.category === "Vocabulary" || lesson.category === "Conversation" || lesson.category === "Numbers") return "everyday";
  return "everyday";
}

export function lessonsForPathway(pathwayId: LearningPathway["id"]): Lesson[] {
  return lessons.filter((lesson) => pathwayForLesson(lesson) === pathwayId);
}

export function pathwayProgress(
  pathwayId: LearningPathway["id"],
  completedLessonIds: string[],
) {
  const pathwayLessons = lessonsForPathway(pathwayId);
  return {
    completed: pathwayLessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length,
    total: pathwayLessons.length,
  };
}

export function isLessonUnlocked(lesson: Lesson, completedLessonIds: string[], assumedKnowledge: string[] = []) {
  if (completedLessonIds.includes(lesson.id)) return true;
  const prerequisites = lesson.prerequisiteLessonIds ?? [];
  // Bad or stale IDs must never make a learner lose access to the course.
  const knownPrerequisites = prerequisites.filter((id) => knownLessonIds.has(id));
  return knownPrerequisites.every((id) => completedLessonIds.includes(id) || assumedKnowledge.includes(id));
}

export function prerequisiteLabel(lesson: Lesson, completedLessonIds: string[], assumedKnowledge: string[] = []) {
  const pending = (lesson.prerequisiteLessonIds ?? [])
    .filter((id) => knownLessonIds.has(id) && !completedLessonIds.includes(id) && !assumedKnowledge.includes(id))
    .map((id) => lessons.find((item) => item.id === id)?.title)
    .filter((title): title is string => Boolean(title));
  return pending.length ? `Complete first: ${pending.join(" · ")}` : "Ready to learn";
}
