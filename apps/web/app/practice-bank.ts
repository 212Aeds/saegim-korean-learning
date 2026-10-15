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
  for (const card of shuffle([...new Map(pool.map(card=>[card.question.id,card])).values()])) {
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
  const remaining = [...balanced];
  const spaced: PracticeCard[] = [];
  const concept = (card: PracticeCard) => card.reference.normalize("NFC").trim().replace(/\s+/gu," ");
  while (remaining.length && spaced.length < Math.max(1, Math.min(20, count))) {
    const recent = spaced.slice(-2).map(concept);
    let index = remaining.findIndex(card=>!recent.includes(concept(card)));
    if (index < 0) index = remaining.findIndex(card=>concept(card)!==recent.at(-1));
    spaced.push(remaining.splice(index < 0 ? 0 : index,1)[0]);
  }
  return spaced.map((card) => ({
      ...card,
      question:
        card.question.type === "choice"
          ? { ...card.question, choices: shuffle(card.question.choices) }
          : card.question,
    }));
}

export function practiceMistakes(cards: PracticeCard[], missedIds: string[]): PracticeCard[] {
  const missed = new Set(missedIds);
  return [...new Map(cards.filter(card=>missed.has(card.question.id)).map(card=>[card.question.id,card])).values()];
}

// Reuse eligible material: recovery never introduces letters outside the learner's route.
export function recoveryPractice(pool: PracticeCard[], progress: SavedProgress): PracticeCard[] {
  const struggled = new Set(progress.reviewItems.filter(item => item.lastResult === "again").map(item => item.front.normalize("NFC").trim()));
  return pool.filter(card => struggled.has(card.reference.normalize("NFC").trim()) && !card.listening);
}
export function listeningPractice(pool: PracticeCard[]): PracticeCard[] {
  const existing = pool.filter(card => card.listening);
  const seen = new Set(existing.map(card => card.reference));
  const extra: PracticeCard[] = [];
  for (const card of pool) {
    if (seen.has(card.reference) || !/^[가-힣]+(?:[ .,!?。？！]*[가-힣]+)*[ .,!?。？！]*$/u.test(card.reference)) continue;
    seen.add(card.reference);
    extra.push({...card, listening:true, question:{id:`ear-${card.question.id}`,type:"text",korean:"?",prompt:"Listen, then write the Korean you hear.",answer:card.reference,accepted:[],placeholder:"Write in Hangul",tip:`You heard: ${card.reference}. ${card.question.tip}`}});
  }
  return [...existing,...extra];
}
export function practiceBreakdown(cards: PracticeCard[], missedIds: string[]) {
  const missed = new Set(missedIds);
  return (["letters","reading","words","sentences"] as const).flatMap(mode => {
    const group = cards.filter(card => card.mode === mode);
    return group.length ? [{mode,total:group.length,firstTry:group.filter(card => !missed.has(card.question.id)).length}] : [];
  });
}
