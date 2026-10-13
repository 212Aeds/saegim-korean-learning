import { normalizeAnswer, type LessonQuestion } from "./curriculum";

export type SavedProgress = {
  dailyPractice: { date: string; lessons: string[]; reviews: string[]; speaking: string[] };
  completed: number;
  dailyGoalMinutes: 5 | 10 | 15 | 20 | 30 | 45 | 60;
  speakingCardIds: string[];
  speakingCardId: string | null;
  learningPreferences: LearningPreferences;
  completedLessonIds: string[];
  wordsLearned: string[];
  reviewsDone: number;
  quizAttempts: number;
  quizCorrect: number;
  streak: number;
  lastActivity: string | null;
  activityDates: string[];
  reviewItems: ReviewItem[];
};

export type LearningPreferences = {
  romanization: boolean;
  hangulSize: "standard" | "large";
  hintLevel: "gentle" | "standard" | "challenge";
  speechVoice: "jessica" | "chris";
  speechPace: number;
};

export const defaultLearningPreferences: LearningPreferences = {
  romanization: true,
  hangulSize: "standard",
  hintLevel: "standard",
  speechVoice: "jessica",
  speechPace: 1,
};

export type ReviewItem = {
  lastResult?: "again" | "remembered";
  id: string;
  front: string;
  question: string;
  answer: string;
  accepted?: string[];
  note: string;
  repetitions: number;
  dueAt: string;
};

export function deduplicateReviewItems(items: ReviewItem[]) {
  const unique = new Map<string, ReviewItem>();
  for (const item of items) {
    const key = `${normalizeAnswer(item.front)}|${normalizeAnswer(item.answer)}`;
    const current = unique.get(key);
    if (!current) {
      unique.set(key, { ...item, accepted: item.accepted ? [...new Set(item.accepted)] : undefined });
      continue;
    }
    const firstDue = [current.dueAt, item.dueAt].sort()[0];
    unique.set(key, {
      ...current,
      note: item.note.length > current.note.length ? item.note : current.note,
      accepted: [...new Set([...(current.accepted ?? []), ...(item.accepted ?? [])])],
      repetitions: Math.max(current.repetitions, item.repetitions),
      dueAt: firstDue,
    });
  }
  return [...unique.values()];
}

export const initialProgress: SavedProgress = {
  dailyPractice: { date: "", lessons: [], reviews: [], speaking: [] },
  completed: 0,
  dailyGoalMinutes: 15,
  speakingCardIds: [],
  speakingCardId: null,
  learningPreferences: defaultLearningPreferences,
  completedLessonIds: [],
  wordsLearned: [],
  reviewsDone: 0,
  quizAttempts: 0,
  quizCorrect: 0,
  streak: 0,
  lastActivity: null,
  activityDates: [],
  reviewItems: [],
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function recordDailyPractice(progress: SavedProgress, kind: "lessons" | "reviews" | "speaking", id: string, date = new Date()): SavedProgress {
  const today = localDateKey(date);
  const daily = progress.dailyPractice?.date === today ? progress.dailyPractice : { date: today, lessons: [], reviews: [], speaking: [] };
  return { ...progress, dailyPractice: { ...daily, [kind]: [...new Set([...daily[kind], id])].slice(0, 500) } };
}

export function recordActivity(
  progress: SavedProgress,
  date = new Date(),
): SavedProgress {
  const today = localDateKey(date);
  const yesterdayDate = new Date(date);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  const streak =
    progress.lastActivity === today
      ? progress.streak
      : progress.lastActivity === yesterday
        ? progress.streak + 1
        : 1;

  return {
    ...progress,
    streak,
    lastActivity: today,
    activityDates: [...new Set([...progress.activityDates, today])].slice(-3660),
  };
}

export function createStarterReviewItems(now = new Date()): ReviewItem[] {
  const items = [
    {
      id: "letter-gieok",
      front: "ㄱ",
      question: "WHAT SOUND DOES THIS LETTER MAKE?",
      answer: "g / k",
      note: "ㄱ is a light sound between English g and k.",
    },
    {
      id: "vowel-a",
      front: "ㅏ",
      question: "WHICH VOWEL SOUND IS THIS?",
      answer: "a, as in father",
      note: "ㅏ makes an open ah sound, as in 가.",
    },
    {
      id: "syllable-ga",
      front: "가",
      question: "WHAT SOUND DOES THIS SYLLABLE MAKE?",
      answer: "ga",
      note: "ㄱ plus ㅏ form 가, read as one syllable block.",
    },
  ];

  return items.map((item) => ({
    ...item,
    repetitions: 0,
    dueAt: now.toISOString(),
  }));
}

export function createLessonReviewItems(
  words: Array<{
    korean: string;
    romanization: string;
    meaning: string;
    tip?: string;
  }>,
  now = new Date(),
): ReviewItem[] {
  return words.map((word, index) => ({
    id: `vocab-${word.korean}-${index}`,
    front: word.korean,
    question: `WHAT DOES ${word.korean} MEAN?`,
    answer: word.meaning,
    note:
      word.tip ??
      `${word.korean} is ${word.meaning}. Say it aloud: ${word.romanization}.`,
    repetitions: 0,
    dueAt: now.toISOString(),
  }));
}

export function createQuestionReviewItems(
  lessonId: string,
  questions: LessonQuestion[],
  now = new Date(),
): ReviewItem[] {
  return questions.map((question) => ({
    id: `question-${lessonId}-${question.id}`,
    front: question.korean,
    question: question.prompt.toLocaleUpperCase().slice(0, 160),
    answer: question.answer,
    accepted: question.type === "text" ? [...question.accepted] : undefined,
    note: question.tip,
    repetitions: 0,
    dueAt: now.toISOString(),
  }));
}

export function dueReviewItems(progress: SavedProgress, now = new Date()) {
  return deduplicateReviewItems(progress.reviewItems)
    .filter((item) => new Date(item.dueAt).getTime() <= now.getTime())
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
}

export function rateReviewItem(
  progress: SavedProgress,
  id: string,
  remembered: boolean,
  now = new Date(),
): SavedProgress {
  if (!progress.reviewItems.some((item) => item.id === id)) return progress;
  const reviewItems = progress.reviewItems.map((item) => {
    if (item.id !== id) return item;
    const repetitions = remembered ? item.repetitions + 1 : 0;
    const days = [1, 3, 7, 14][Math.min(repetitions - 1, 3)] ?? 14;
    const dueAt = new Date(
      now.getTime() + (remembered ? days * 86_400_000 : 10 * 60_000),
    ).toISOString();
    return { ...item, repetitions, dueAt, lastResult: remembered ? "remembered" as const : "again" as const };
  });
  const next = { ...progress, reviewItems };
  return recordActivity(
    recordDailyPractice({ ...next, reviewsDone: progress.reviewsDone + (remembered ? 1 : 0) }, "reviews", id, now),
    now,
  );
}

