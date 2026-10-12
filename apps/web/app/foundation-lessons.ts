import type { Lesson, LessonQuestion } from "./curriculum";
import { hangulLetters } from "./more-lessons";
import { consonantAnswers, hangulName } from "./ui/hangul-answers";
import { transcriptRomanization } from "./ui/transcript-romanization";

// App-authored sequencing. Letter inventory and romanization follow NIKL.
// https://www.korean.go.kr/eng_hangeul/principle/001.html
const groups = [
  ["hangul-core-vowels", "Vowels: a, eo, i", "ㅏㅓㅣ", "Three upright vowel shapes. Notice the stroke direction and learn each sound separately."],
  ["hangul-round-vowels", "Vowels: o, u, eu", "ㅗㅜㅡ", "Three vowels with a horizontal stroke. ㅗ points up; ㅜ points down; ㅡ has no extra short stroke."],
  ["hangul-y-vowels", "Vowels with a y sound", "ㅑㅕㅛㅠ", "A second short stroke adds a y-like starting sound to these four vowels."],
  ["hangul-core-consonants", "Consonants: g, n, d, r", "ㄱㄴㄷㄹ", "Learn the shapes and names of four common consonants. English letters are approximate cues, not exact Korean sounds."],
  ["hangul-lips-consonants", "Consonants: m, b, s, silent ㅇ", "ㅁㅂㅅㅇ", "Learn four more shapes. ㅇ is silent at the start of a syllable and ng at the end."],
  ["hangul-air-consonants", "Consonants: j, ch, k, t, p, h", "ㅈㅊㅋㅌㅍㅎ", "Notice the extra strokes in the aspirated letters. They have a stronger release of air than their plain partners."],
  ["hangul-tense-consonants", "Tense consonant pairs", "ㄲㄸㅃㅆㅉ", "These paired shapes represent tense consonants. Listen for their Korean pronunciation rather than simply making an English consonant louder."],
  ["hangul-ae-e-vowels", "Vowels: ae, e, yae, ye", "ㅐㅔㅒㅖ", "Learn the spellings separately even when vowel sounds are similar in modern speech."],
  ["hangul-wa-vowels", "Vowels: wa, wae, oe", "ㅘㅙㅚ", "These shapes combine ㅗ with another vowel. Learn each combined spelling as one vowel."],
  ["hangul-wo-vowels", "Vowels: wo, we, wi, ui", "ㅝㅞㅟㅢ", "Finish the vowel inventory with these combined shapes. Pronunciation can depend on context, especially for ㅢ."],
] as const;
export const coreLetterLessonIds = groups.slice(0, 6).map(([id]) => id);
export const basicReadingPrerequisites = [...coreLetterLessonIds, "build-a-syllable", "hangul-syllable-blocks", "hangul-batchim"];

const letterLessons: Lesson[] = groups.map(([id, title, letters, explanation], index) => {
  const entries = [...letters].map((letter) => hangulLetters.find((entry) => entry.korean === letter)!);
  const questions: LessonQuestion[] = entries.flatMap((entry, number) => [
    { id: `${id}-name-${number}`, type: "text", korean: entry.korean, prompt: "Type this letter’s name or sound cue.", answer: entry.romanization.trim(), accepted: [...consonantAnswers(entry.korean), ...(hangulName(entry.korean) ? [hangulName(entry.korean)!] : []), ...(entry.korean === "ㅏ" ? ["ah"] : entry.korean === "ㅓ" ? ["uh"] : [])], placeholder: "Name or romanized sound", tip: `${entry.korean}: ${entry.romanization.trim()} — ${entry.meaning}. Roman letters are approximate guides.` },
    { id: `${id}-shape-${number}`, type: "text", korean: entry.korean, prompt: `Write the letter named ${entry.romanization.trim()}.`, answer: entry.korean, accepted: [], placeholder: "One Hangul letter", tip: `The shape is ${entry.korean}. Focus on the short strokes and their direction.` },
  ]);
  return { id, title, detail: `Learn ${entries.length} letters before reading words`, category: "Hangul", minutes: 5, pathwayId: "hangul", level: "foundation", authoredOnly: true,
    prerequisiteLessonIds: index === 0 ? ["hangul-first-sounds"] : index < 6 ? [groups[index - 1][0]] : ["hangul-air-consonants"], words: [...letters], questions,
    briefing: { focus: "Letter shapes first. Words come later.", explanation: `${explanation} ${entries.map((entry) => `${entry.korean} = ${entry.romanization.trim()}`).join("; ")}.`, useWhen: "Recognize each letter on its own before combining it into a syllable.", example: entries[0].korean, translation: `Letter: ${entries[0].romanization.trim()}`, watchFor: "This lesson asks about letters, not vocabulary. You do not need to know any whole Korean words yet." } };
});

const readingGroups = [
  ["hangul-read-a-eo", "Read blocks with a and eo", "가나마바거너머버"],
  ["hangul-read-o-u", "Read blocks with o and u", "고노모보구누무부"],
  ["hangul-read-i-eu", "Read blocks with i and eu", "기니미비그느므브"],
  ["hangul-read-y", "Read blocks with y vowels", "갸냐겨녀교뇨규뉴"],
  ["hangul-read-air", "Read aspirated consonants", "차카타파처커터퍼"],
] as const;
const readingLessons: Lesson[] = readingGroups.map(([id, title, blocks]) => ({
  id, title, detail: "Read and build eight blocks using letters already covered", category: "Hangul", minutes: 8, pathwayId: "hangul", level: "foundation", authoredOnly: true,
  prerequisiteLessonIds: ["build-a-syllable"], words: [...blocks],
  briefing: { focus: "Combine familiar letters into one sound.", explanation: "Read each block as one syllable. These are reading samples, not vocabulary definitions. Focus on the starting consonant and the vowel beside or below it.", useWhen: "Practice decoding a new block without guessing a word’s meaning.", example: [...blocks][0], translation: `Reading sample: ${transcriptRomanization([...blocks][0])}`, watchFor: "Romanization helps you compare spellings; listening helps you hear Korean pronunciation." },
  questions: [...blocks].flatMap((block, number): LessonQuestion[] => {
    const code = block.charCodeAt(0) - 0xac00;
    const onset = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"][Math.floor(code / 588)];
    const vowel = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"][Math.floor(code % 588 / 28)];
    return [
      { id: `${id}-read-${number}`, type: "text", korean: block, prompt: "Read this block in roman letters.", answer: transcriptRomanization(block), accepted: [], placeholder: "Romanized syllable", tip: `${onset} + ${vowel} builds ${block}. Read the two letters together.` },
      { id: `${id}-build-${number}`, type: "text", korean: `${onset} + ${vowel}`, prompt: "Build the Hangul block from these letters.", answer: block, accepted: [], placeholder: "One syllable block", tip: `${onset} + ${vowel} → ${block}. This is a reading sample, not a word definition.` },
    ];
  }),
}));
export const foundationLessons: Lesson[] = [...letterLessons, ...readingLessons, {
  id: "first-readable-words", title: "Your first readable words", detail: "Use familiar letters and final sounds to read real words", category: "Vocabulary", minutes: 8, pathwayId: "everyday", level: "foundation", prerequisiteLessonIds: basicReadingPrerequisites,
  words: ["가방", "나무", "바다", "우유"],
  briefing: { focus: "Now letters become words.", explanation: "You have practiced the basic letters, syllable layout, and final consonants. Decode each word one block at a time, then connect it with a meaning.", useWhen: "Begin vocabulary after the alphabet foundations are ready.", example: "가방", translation: "bag", watchFor: "The bottom ㅇ in 방 has an ng sound; it is not the silent starting ㅇ." },
  questions: [
    { id: "readable-bag", type: "choice", korean: "가방", prompt: "What does 가방 mean?", choices: ["bag", "milk", "sea"], answer: "bag", tip: "가방 is bag: 가 + 방." },
    { id: "readable-tree", type: "choice", korean: "나무", prompt: "What does 나무 mean?", choices: ["tree", "bag", "milk"], answer: "tree", tip: "나무 is tree: 나 + 무." },
    { id: "readable-sea", type: "choice", korean: "바다", prompt: "What does 바다 mean?", choices: ["sea", "tree", "bag"], answer: "sea", tip: "바다 is sea: 바 + 다." },
    { id: "readable-milk", type: "choice", korean: "우유", prompt: "What does 우유 mean?", choices: ["milk", "sea", "tree"], answer: "milk", tip: "우유 is milk: 우 + 유. Starting ㅇ is silent." },
  ],
}];
