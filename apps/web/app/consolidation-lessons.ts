import type { Lesson, LessonQuestion } from "./curriculum";
import { journeyTopics } from "./journey-content";
import { foundationLessons } from "./foundation-lessons";
import { hangulLetters } from "./more-lessons";
import { consonantAnswers, hangulName } from "./ui/hangul-answers";

// Reuses the attributed vocabulary senses and app-authored examples in journey-content.
const topicPractice: Lesson[] = journeyTopics.map((topic) => ({
  id: `${topic.id}-consolidation`, title: `${topic.title}: put it together`,
  detail: "Sentence gaps, contextual meanings, and connected reading",
  category: "Conversation", pathwayId: topic.id === "opinions" ? "stretch" : "everyday",
  level: topic.id === "opinions" ? "stretch" : "intermediate", minutes: 12,
  words: topic.items.map((item) => item[0]), prerequisiteLessonIds: [`${topic.id}-dialogue`], authoredOnly: true,
  briefing: { focus: "Use the words you met in the previous two lessons.", explanation: "Recall a missing word from a familiar sentence, recognize its contextual meaning, then connect two sentences. These drills reuse earlier examples; they do not introduce a new grammar rule.", useWhen: "Try this after the topic's word and exchange lessons, then use the same topic with your conversation partner.", example: topic.items[0][2], translation: topic.items[0][3] },
  questions: [
    ...topic.items.flatMap(([word, meaning, example, translation], index): LessonQuestion[] => [
      { id: `word-hangul-${topic.id}-gap-${index}`, type: "text", korean: word, prompt: `Fill the gap with this lesson’s target word: ${example.replace(word, "___")} (${translation})`, answer: word, accepted: [], placeholder: "Missing Korean word", tip: `The target word is ${word}. ${example} ${translation}` },
      { id: `${topic.id}-context-${index}`, type: "choice", korean: example, prompt: `What does ${word} mean in this sentence?`, answer: meaning, choices: [meaning, ...topic.items.filter((item) => item[1] !== meaning).slice(0, 3).map((item) => item[1])], tip: `${word}: ${meaning}. ${translation}` },
    ]),
    ...[0, 2].map((index): LessonQuestion => {
      const first = topic.items[index], second = topic.items[index + 1];
      const answer = `${first[3]} ${second[3]}`;
      return { id: `${topic.id}-connected-${index}`, type: "choice", korean: `${first[2]} ${second[2]}`, prompt: "Read both sentences. Which meaning matches the complete message?", answer,
        choices: [answer, `${topic.items[4][3]} ${second[3]}`, `${first[3]} ${topic.items[5][3]}`], tip: `${first[2]} → ${first[3]} ${second[2]} → ${second[3]}` };
    }),
  ],
}));

const letterCheckpoints: Lesson[] = [
  { id: "checkpoint-vowels", title: "Checkpoint: six familiar vowels", letters: "ㅏㅓㅣㅗㅜㅡ", prerequisites: ["hangul-core-vowels", "hangul-round-vowels"] },
  { id: "checkpoint-consonants", title: "Checkpoint: eight familiar consonants", letters: "ㄱㄴㄷㄹㅁㅂㅅㅇ", prerequisites: ["hangul-core-consonants", "hangul-lips-consonants"] },
].map(({ id, title, letters, prerequisites }) => {
  const entries = [...letters].map((letter) => hangulLetters.find((word) => word.korean === letter)!);
  return { id, title, detail: "Mix familiar shapes and sound cues before moving on", category: "Hangul", pathwayId: "hangul", level: "foundation", minutes: 8, words: [...letters], prerequisiteLessonIds: prerequisites, authoredOnly: true,
    briefing: { focus: "Check the letters you have already met.", explanation: "The order is mixed, so use the shape and sound rather than remembering a list. English sound cues remain approximations. This practice does not introduce whole-word vocabulary.", useWhen: "Revisit familiar letters before reading syllable blocks.", example: entries[0].korean, translation: `Letter cue: ${entries[0].romanization}` },
    questions: entries.flatMap((entry, index): LessonQuestion[] => [
      { id: `${id}-name-${index}`, type: "text", korean: entry.korean, prompt: "Recall this letter’s name or sound cue.", answer: entry.romanization.trim(), accepted: [...consonantAnswers(entry.korean), hangulName(entry.korean) ?? entry.romanization.trim(), ...(entry.korean === "ㅏ" ? ["ah"] : entry.korean === "ㅓ" ? ["uh"] : [])], placeholder: "Name or sound cue", tip: `${entry.korean}: ${entry.romanization.trim()} — ${entry.meaning}.` },
      { id: `${id}-shape-${index}`, type: "text", korean: entry.korean, prompt: `Write the letter named ${entry.romanization.trim()}.`, answer: entry.korean, accepted: [], placeholder: "Hangul letter", tip: `The letter is ${entry.korean}.` },
    ]),
  };
});
const readingSamples = foundationLessons.filter((lesson) => ["hangul-read-a-eo", "hangul-read-o-u"].includes(lesson.id));
export const consolidationLessons: Lesson[] = [
  ...letterCheckpoints,
  { id: "hangul-read-checkpoint", title: "Checkpoint: mixed syllable reading", detail: "Bring a, eo, o, and u blocks into one mixed practice", category: "Hangul", pathwayId: "hangul", level: "foundation", minutes: 10, authoredOnly: true,
    words: readingSamples.flatMap((lesson) => lesson.words).filter((_, index) => index % 2 === 0), prerequisiteLessonIds: readingSamples.map((lesson) => lesson.id),
    briefing: { focus: "Decode familiar syllables in a mixed order.", explanation: "These are reading samples, not word definitions. Look for the initial consonant and the vowel, then combine them into a block.", useWhen: "Practice after the first two block-reading lessons.", example: "가", translation: "Reading sample: ga" },
    questions: readingSamples.flatMap((lesson) => lesson.questions.filter((_, index) => Math.floor(index / 2) % 2 === 0)),
  },
  ...topicPractice,
];
