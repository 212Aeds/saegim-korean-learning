import { moreLessons } from "./more-lessons";
import { newLessons } from "./new-lessons";

export type MultipleChoiceQuestion = {
  id: string;
  type: "choice";
  korean: string;
  prompt: string;
  choices: string[];
  answer: string;
  tip: string;
};

export type TextQuestion = {
  id: string;
  type: "text";
  korean: string;
  prompt: string;
  answer: string;
  accepted: string[];
  placeholder: string;
  tip: string;
};

export type LessonQuestion = MultipleChoiceQuestion | TextQuestion;

export type LessonBriefing = {
  focus: string;
  explanation: string;
  useWhen: string;
  example: string;
  translation: string;
  watchFor?: string;
};

// Reading samples are learning items, not dictionary headwords or word senses.
export type HangulSyllableExample = {
  id: string;
  korean: string;
  romanization: string;
  letters: string[];
};

export type Lesson = {
  id: string;
  title: string;
  detail: string;
  category: string;
  minutes: number;
  words: string[];
  questions: LessonQuestion[];
  briefing?: LessonBriefing;
  pathwayId?: string;
  level?: "foundation" | "intermediate" | "stretch";
  prerequisiteLessonIds?: string[];
  practiceOnlyQuestionIds?: string[];
  generatedPracticeOnly?: boolean;
};

export const lessons: Lesson[] = [
  {
    id: "hangul-first-sounds",
    title: "Hello, Hangul",
    detail: "Meet your first letters and syllable block",
    category: "Hangul",
    minutes: 6,
    words: ["가방", "안녕"],
    pathwayId: "hangul",
    level: "foundation",
    briefing: {
      focus: "Meet the consonant ㄱ, vowel ㅏ, and the block 가.",
      explanation: "ㄱ begins with a light sound between English g and k. ㅏ is an open ah vowel. Put them together in one square block and read 가 as ga.",
      useWhen: "Use this consonant-plus-vowel pattern to sound out each Hangul block before reading a whole word.",
      example: "가방",
      translation: "bag (가 + 방)",
      watchFor: "The Korean sound does not map perfectly to an English letter; treat g/k as a pronunciation guide, not two different answers.",
    },
    questions: [
      {
        id: "first-gieok",
        type: "choice",
        korean: "ㄱ",
        prompt: "This letter usually sounds like…",
        choices: ["g / k", "m", "s"],
        answer: "g / k",
        tip: "ㄱ is a light sound between English g and k. Listen for it in 가.",
      },
      {
        id: "first-a",
        type: "text",
        korean: "ㅏ",
        prompt: "Type the sound this vowel makes.",
        answer: "a",
        accepted: ["ah"],
        placeholder: "Type a sound",
        tip: "ㅏ makes an open ah sound, like the a in father.",
      },
      {
        id: "first-ga",
        type: "text",
        korean: "가",
        prompt: "Type the sound of this syllable.",
        answer: "ga",
        accepted: ["ka"],
        placeholder: "Romanized sound",
        tip: "You built 가: ㄱ plus ㅏ, read together as one syllable block.",
      },
      {
        id: "first-bag",
        type: "choice",
        korean: "가방",
        prompt: "What does this useful word mean?",
        choices: ["bag", "water", "friend"],
        answer: "bag",
        tip: "가방 means bag. Two Hangul blocks join to make one word.",
      },
      {
        id: "first-hello",
        type: "choice",
        korean: "안녕",
        prompt: "What does this greeting mean?",
        choices: ["hi / hello", "thank you", "good night"],
        answer: "hi / hello",
        tip: "안녕 is an informal hello used with friends.",
      },
    ],
  },
  {
    id: "hangul-more-sounds",
    title: "More Hangul sounds",
    detail: "Recognize three more everyday letters",
    category: "Hangul",
    minutes: 5,
    words: ["나", "너", "미소"],
    pathwayId: "hangul",
    level: "foundation",
    prerequisiteLessonIds: ["hangul-first-sounds"],
    briefing: {
      focus: "A consonant and vowel join to make one syllable block.",
      explanation: "ㄴ gives the n sound. Pair it with ㅏ for 나 (na), or ㅓ for 너 (neo). A vowel that follows the consonant is placed to its right or underneath depending on its shape.",
      useWhen: "Use the block layout to decode a new word from left to right, one syllable at a time.",
      example: "미소",
      translation: "smile (mi-so)",
      watchFor: "ㅓ is written eo in standard romanization, but its sound is closer to a relaxed uh than a long English e-o sequence.",
    },
    questions: [
      {
        id: "sound-nieun",
        type: "choice",
        korean: "ㄴ",
        prompt: "Which sound starts with this letter?",
        choices: ["n", "b / p", "j"],
        answer: "n",
        tip: "ㄴ is the n sound, as in 나 (na).",
      },
      {
        id: "sound-eo",
        type: "text",
        korean: "ㅓ",
        prompt: "Type the common romanized sound.",
        answer: "eo",
        accepted: ["uh"],
        placeholder: "Romanized vowel",
        tip: "ㅓ is romanized eo. Its sound is close to the uh in young.",
      },
      {
        id: "sound-na",
        type: "choice",
        korean: "나",
        prompt: "What sound do these blocks make?",
        choices: ["na", "no", "ma"],
        answer: "na",
        tip: "ㄴ (n) plus ㅏ (a) gives 나 (na).",
      },
      {
        id: "sound-mi",
        type: "text",
        korean: "미소",
        prompt: "미소 means smile. Type its first syllable.",
        answer: "mi",
        accepted: ["미"],
        placeholder: "First syllable",
        tip: "미소 means smile. 미 is the first syllable; 소 is the second.",
      },
    ],
  },
  {
    id: "build-a-syllable",
    title: "Build a syllable",
    detail: "Put consonants and vowels in their places",
    category: "Hangul",
    minutes: 6,
    words: ["나무", "바다", "우유"],
    pathwayId: "hangul",
    level: "foundation",
    prerequisiteLessonIds: ["hangul-first-sounds", "hangul-more-sounds"],
    briefing: {
      focus: "Build a square syllable from one starting consonant and a vowel.",
      explanation: "In a Hangul block, the consonant comes first. A vertical vowel goes beside it; a horizontal vowel sits below it. Read the finished block as one beat.",
      useWhen: "Apply this every time you read or write a Korean word; each visible block is a syllable.",
      example: "ㄴ + ㅏ → 나; ㄴ + ㅓ → 너",
      translation: "n + a → na; n + eo → neo",
      watchFor: "A block is a syllable, not a full word by itself in every case.",
    },
    questions: [
      {
        id: "block-order",
        type: "choice",
        korean: "ㄴ + ㅏ",
        prompt: "Which Hangul block combines these sounds?",
        choices: ["나", "너", "다"],
        answer: "나",
        tip: "The consonant comes first, with the vowel beside or below it.",
      },
      {
        id: "block-tree",
        type: "text",
        korean: "나무",
        prompt: "나무 means tree. Type the word in roman letters.",
        answer: "namu",
        accepted: ["na-mu", "na mu"],
        placeholder: "Romanized word",
        tip: "나무 is na-mu. Each of its two syllables is one block.",
      },
      {
        id: "block-water",
        type: "choice",
        korean: "바다",
        prompt: "Which meaning matches 바다?",
        choices: ["sea", "milk", "tree"],
        answer: "sea",
        tip: "바다 (bada) means sea. Say each block smoothly: ba-da.",
      },
      {
        id: "block-milk",
        type: "text",
        korean: "우유",
        prompt: "Type what 우유 means in English.",
        answer: "milk",
        accepted: [],
        placeholder: "Meaning in English",
        tip: "우유 (uyu) means milk.",
      },
    ],
  },
  {
    id: "hello-there",
    title: "Hello there",
    detail: "Choose a greeting for the moment",
    category: "Conversation",
    minutes: 5,
    words: ["안녕하세요", "감사합니다", "죄송합니다"],
    pathwayId: "everyday",
    level: "foundation",
    briefing: {
      focus: "Choose a polite greeting, thanks, or apology for the situation.",
      explanation: "안녕하세요 is a friendly polite hello. 감사합니다 thanks someone, and 죄송합니다 apologizes politely. Learn these complete expressions before changing their endings.",
      useWhen: "Use them when meeting someone, receiving help, or apologizing to a person you address politely.",
      example: "안녕하세요! 저는 학생이에요.",
      translation: "Hello! I am a student.",
      watchFor: "안녕 is casual; save it for close friends or people with whom casual speech is agreed. 안녕하세요 is a greeting, not the usual goodbye.",
    },
    questions: [
      {
        id: "hello-polite",
        type: "choice",
        korean: "안녕하세요",
        prompt: "When is this greeting a good choice?",
        choices: ["A polite hello", "A casual goodbye", "Good night"],
        answer: "A polite hello",
        tip: "안녕하세요 (annyeonghaseyo) is a friendly, polite hello.",
      },
      {
        id: "hello-thanks",
        type: "text",
        korean: "감사합니다",
        prompt: "Type the meaning of 감사합니다.",
        answer: "thank you",
        accepted: ["thanks"],
        placeholder: "Meaning in English",
        tip: "감사합니다 (gamsahamnida) means thank you.",
      },
      {
        id: "hello-apology",
        type: "choice",
        korean: "죄송합니다",
        prompt: "Which meaning matches this polite phrase?",
        choices: ["I'm sorry", "See you tomorrow", "Welcome"],
        answer: "I'm sorry",
        tip: "죄송합니다 (joesonghamnida) is a polite way to say I’m sorry.",
      },
      {
        id: "hello-practice",
        type: "text",
        korean: "안녕하세요",
        prompt: "Type a romanized start: annyeong…",
        answer: "annyeonghaseyo",
        accepted: ["annyeong ha se yo", "annyeong-ha-se-yo"],
        placeholder: "Finish the greeting",
        tip: "The full phrase is annyeonghaseyo. Listen, then say it aloud slowly.",
      },
    ],
  },
  {
    id: "introductions",
    title: "Meet & greet",
    detail: "Introduce yourself with a useful sentence",
    category: "Grammar",
    minutes: 7,
    words: ["저", "이름", "학생", "친구"],
    pathwayId: "grammar",
    level: "foundation",
    briefing: {
      focus: "Introduce yourself with the polite copula -이에요/-예요.",
      explanation: "Attach -이에요 after a noun ending in a consonant and -예요 after a noun ending in a vowel. 저 means ‘I’ in a polite register; 는 marks it as the topic.",
      useWhen: "Use the ending to say what someone or something is in a friendly, polite conversation.",
      example: "저는 학생이에요.",
      translation: "I am a student.",
      watchFor: "The subject ‘I’ is often understood from context, so Korean can omit 저는 when it is clear.",
    },
    questions: [
      {
        id: "intro-topic",
        type: "choice",
        korean: "저는",
        prompt: "What does 저는 do in a sentence?",
        choices: [
          "Sets ‘I’ as the topic",
          "Means ‘goodbye’",
          "Means ‘student’",
        ],
        answer: "Sets ‘I’ as the topic",
        tip: "저 means I (polite); 는 marks the topic: as for me…",
      },
      {
        id: "intro-ending",
        type: "text",
        korean: "학생 + ?",
        prompt: "학생 ends in a consonant. Type the polite ‘am’ ending.",
        answer: "이에요",
        accepted: ["ieyo", "i-e-yo"],
        placeholder: "Korean ending or romanization",
        tip: "학생이에요 means (I’m a) student. Use -이에요 after a consonant.",
      },
      {
        id: "intro-friend",
        type: "choice",
        korean: "친구",
        prompt: "친구 ends in a vowel. Which polite ending follows?",
        choices: ["-예요", "-이에요", "-습니다"],
        answer: "-예요",
        tip: "친구예요 means (I’m a) friend. Use -예요 after a vowel.",
      },
      {
        id: "intro-student",
        type: "text",
        korean: "저는 학생이에요",
        prompt: "Type what this sentence means.",
        answer: "i am a student",
        accepted: ["i'm a student", "i am student"],
        placeholder: "Meaning in English",
        tip: "저는 학생이에요: I’m a student. It’s polite and useful when meeting someone.",
      },
    ],
  },
  {
    id: "everyday-words",
    title: "Everyday words",
    detail: "Remember a few useful things and places",
    category: "Vocabulary",
    minutes: 6,
    words: ["물", "밥", "집", "학교", "오늘"],
    pathwayId: "everyday",
    level: "foundation",
    briefing: {
      focus: "Use everyday nouns in short, polite sentences.",
      explanation: "물 is water, 밥 is cooked rice or a meal, 집 is home, and 학교 is school. A noun names a thing or place; particles and a final predicate make its sentence role clear.",
      useWhen: "Use these words to ask for water, talk about meals, or say where you are going today.",
      example: "오늘 학교에 가요.",
      translation: "I go to school today.",
      watchFor: "밥 can mean a meal as well as rice. 오늘 means today and normally needs no 에 time particle.",
    },
    questions: [
      {
        id: "everyday-water",
        type: "choice",
        korean: "물",
        prompt: "What does 물 mean?",
        choices: ["water", "rice / meal", "home"],
        answer: "water",
        tip: "물 (mul) means water.",
      },
      {
        id: "everyday-meal",
        type: "text",
        korean: "밥",
        prompt: "Type the meaning of 밥.",
        answer: "rice",
        accepted: ["meal", "cooked rice"],
        placeholder: "Meaning in English",
        tip: "밥 means cooked rice, and by extension a meal.",
      },
      {
        id: "everyday-home",
        type: "choice",
        korean: "집",
        prompt: "Choose the meaning of 집.",
        choices: ["home / house", "school", "today"],
        answer: "home / house",
        tip: "집 (jip) means home or house.",
      },
      {
        id: "everyday-today",
        type: "text",
        korean: "오늘",
        prompt: "Type the meaning of 오늘.",
        answer: "today",
        accepted: [],
        placeholder: "Meaning in English",
        tip: "오늘 (oneul) means today.",
      },
    ],
  },
  ...moreLessons,
  ...newLessons,
];

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\bi'm\b/g, "i am")
    .replace(/\byou're\b/g, "you are")
    .replace(/\bhe's\b/g, "he is")
    .replace(/\bshe's\b/g, "she is")
    .replace(/\bit's\b/g, "it is")
    .replace(/\bwe're\b/g, "we are")
    .replace(/\bthey're\b/g, "they are")
    .trim()
    .replace(/[\s\-.,!?']/g, "");
}

export function isCorrectTextAnswer(question: TextQuestion, value: string) {
  const answer = normalizeAnswer(value);
  return [question.answer, ...question.accepted].some(
    (accepted) => normalizeAnswer(accepted) === answer,
  );
}

