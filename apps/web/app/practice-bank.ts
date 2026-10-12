import { lessons, shuffle, type LessonQuestion } from "./curriculum";
import { hangulLetters } from "./more-lessons";
import {
  recommendedLessons,
  placementKnowledge,
  type LearningProfile,
} from "./learning-profile";
import { basicReadingPrerequisites } from "./foundation-lessons";
import { consonantAnswers, hangulName } from "./ui/hangul-answers";
import { transcriptRomanization } from "./ui/transcript-romanization";
import { generatedQuestions } from "./ui/lesson-questions";
import type { SavedProgress } from "./progress";
export type PracticeMode =
  "letters" | "reading" | "words" | "sentences" | "mixed";
export type PracticeCard = {
  question: LessonQuestion;
  reference: string;
  readingSample: boolean;
  listening?: boolean;
  mode: Exclude<PracticeMode, "mixed">;
};
const onsets = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
const vowels = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
export function readingBlocks(knownLetters: string[]) {
  const known = new Set(knownLetters);
  return onsets.flatMap((onset, index) =>
    known.has(onset)
      ? vowels.flatMap((vowel, vowelIndex) =>
          known.has(vowel)
            ? [
                {
                  korean: String.fromCharCode(
                    0xac00 + index * 588 + vowelIndex * 28,
                  ),
                  letters: [onset, vowel],
                },
              ]
            : [],
        )
      : [],
  );
}
export function practicePool(
  progress: SavedProgress,
  profile: LearningProfile,
  mode: PracticeMode,
): PracticeCard[] {
  const assumed = placementKnowledge(profile);
  const next = recommendedLessons(progress.completedLessonIds, profile)[0];
  const availableIds = new Set([
    ...progress.completedLessonIds,
    ...assumed,
    ...(next ? [next.id] : []),
  ]);
  const available = lessons.filter((lesson) => availableIds.has(lesson.id));
  const knownLetters = [
    ...new Set(
      available.flatMap((lesson) =>
        lesson.words.filter((word) => /^[ㄱ-ㅎㅏ-ㅣ]$/u.test(word)),
      ),
    ),
  ];
  const cards: PracticeCard[] = knownLetters.flatMap((letter) => {
    const entry = hangulLetters.find((word) => word.korean === letter)!;
    return [
      {
        mode: "letters" as const,
        reference: letter,
        readingSample: true,
        question: {
          id: `drill-name-${letter}`,
          type: "text" as const,
          korean: letter,
          prompt: "Type this letter’s name or sound cue.",
          answer: entry.romanization.trim(),
          accepted: [
            ...consonantAnswers(letter),
            ...(hangulName(letter) ? [hangulName(letter)!] : []),
            ...(letter === "ㅏ" ? ["ah"] : letter === "ㅓ" ? ["uh"] : []),
          ],
          placeholder: "Letter name or sound",
          tip: `${letter} = ${entry.romanization.trim()}; ${entry.meaning}. English cues are approximate.`,
        },
      },
      {
        mode: "letters" as const,
        reference: letter,
        readingSample: true,
        question: {
          id: `drill-shape-${letter}`,
          type: "text" as const,
          korean: "?",
          prompt: `Write the letter named ${entry.romanization.trim()}.`,
          answer: letter,
          accepted: [],
          placeholder: "Hangul letter",
          tip: `The letter is ${letter}.`,
        },
      },
    ];
  });
  if (knownLetters.length > 1)
    for (const letter of knownLetters) {
      const entry = hangulLetters.find((word) => word.korean === letter)!;
      cards.push({
        mode: "letters",
        reference: letter,
        readingSample: true,
        question: {
          id: `drill-choice-${letter}`,
          type: "choice",
          korean: "?",
          prompt: `Which letter is named ${entry.romanization.trim()}?`,
          choices: [
            letter,
            ...knownLetters.filter((item) => item !== letter).slice(0, 3),
          ],
          answer: letter,
          tip: `${letter}: ${entry.meaning}. Sound cues are approximate.`,
        },
      });
    }
  for (const card of [...cards].filter(
    (card) => card.question.type === "choice",
  )) {
    cards.push({
      ...card,
      listening: true,
      question: {
        ...card.question,
        id: `listen-${card.question.id}`,
        korean: "?",
        prompt: "Listen, then choose the letter you heard.",
      },
    });
  }
  for (const block of readingBlocks(knownLetters)) {
    cards.push({
      mode: "reading",
      reference: block.korean,
      readingSample: true,
      question: {
        id: `drill-read-${block.korean}`,
        type: "text",
        korean: block.korean,
        prompt: "Read this block in roman letters.",
        answer: transcriptRomanization(block.korean),
        accepted: [],
        placeholder: "Romanized syllable",
        tip: `${block.letters.join(" + ")} builds ${block.korean}. This is a reading sample, not a word definition.`,
      },
    });
    cards.push({
      mode: "reading",
      reference: block.korean,
      readingSample: true,
      question: {
        id: `drill-build-${block.korean}`,
        type: "text",
        korean: block.letters.join(" + "),
        prompt: "Build one Hangul block from these letters.",
        answer: block.korean,
        accepted: [],
        placeholder: "Hangul block",
        tip: `${block.letters.join(" + ")} → ${block.korean}.`,
      },
    });
  }
  const vocabularyReady =
    profile.level !== "new" ||
    basicReadingPrerequisites.every((id) =>
      progress.completedLessonIds.includes(id),
    );
  if (vocabularyReady)
    for (const lesson of available.filter(
      (lesson) => lesson.category !== "Hangul",
    )) {
      for (const question of [
        ...lesson.questions,
        ...(lesson.authoredOnly ? [] : generatedQuestions(lesson)),
      ]) {
        const sentence =
          lesson.category === "Grammar" ||
          (lesson.category === "Conversation" &&
            question.korean.trim().split(/\s+/u).length > 1);
        cards.push({
          mode: sentence ? "sentences" : "words",
          reference: question.korean,
          readingSample: false,
          question,
        });
      }
    }
  const unique = [
    ...new Map(cards.map((card) => [card.question.id, card])).values(),
  ];
  return mode === "mixed"
    ? unique
    : unique.filter((card) => card.mode === mode);
}
export function practiceSession(pool: PracticeCard[], count: number) {
  const groups = new Map<string, PracticeCard[]>();
  for (const card of shuffle(pool)) {
    const key = `${card.mode}-${card.listening ? "listening" : card.question.type}`;
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }
  const balanced: PracticeCard[] = [];
  const buckets = shuffle([...groups.values()]);
  while (buckets.some((bucket) => bucket.length))
    for (const bucket of buckets) {
      const card = bucket.pop();
      if (card) balanced.push(card);
    }
  return balanced
    .slice(0, Math.max(1, Math.min(20, count)))
    .map((card) => ({
      ...card,
      question:
        card.question.type === "choice"
          ? { ...card.question, choices: shuffle(card.question.choices) }
          : card.question,
    }));
}
