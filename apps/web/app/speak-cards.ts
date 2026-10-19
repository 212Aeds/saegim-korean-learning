import { opinionSpeaking } from "./opinion-speaking";
import { lessons } from "./curriculum";
import { journeyTopics } from "./journey-content";
import { hangulLetters } from "./more-lessons";
import {
  recommendedLessons,
  placementKnowledge,
  learningRoute,
  type LearningProfile,
} from "./learning-profile";
import { isLessonUnlocked } from "./learning-pathways";
import { transcriptRomanization } from "./ui/transcript-romanization";
type Phrase = {
  korean: string;
  romanization: string;
  meaning: string;
  focus: string;
  focusRomanization: string;
  focusMeaning: string;
  grammarTitle: string;
  grammarTip: string;
};

export type SpeakingCard = {
  lessonId?: string;
  id: string;
  kind: "word" | "phrase" | "pronunciation" | "grammar" | "recall";
  promptLabel: string;
  prompt: string;
  korean: string;
  romanization: string;
  meaning: string;
  focus: string;
  focusRomanization: string;
  focusMeaning: string;
  grammarTitle: string;
  grammarTip: string;
};

const phrases: Phrase[] = [
  {
    korean: "안녕하세요",
    romanization: "annyeonghaseyo",
    meaning: "Hello. (polite)",
    focus: "안녕하세요",
    focusRomanization: "annyeonghaseyo",
    focusMeaning: "polite hello",
    grammarTitle: "The polite hello",
    grammarTip:
      "안녕하세요 is a polite greeting. The ending -세요 also appears in respectful requests.",
  },
  {
    korean: "안녕",
    romanization: "annyeong",
    meaning: "Hi. / Bye. (casual)",
    focus: "안녕",
    focusRomanization: "annyeong",
    focusMeaning: "casual hello or goodbye",
    grammarTitle: "Casual greeting",
    grammarTip:
      "안녕 is friendly and informal. Use it with friends or people you know well.",
  },
  {
    korean: "저는 학생이에요",
    romanization: "jeoneun haksaengieyo",
    meaning: "I’m a student.",
    focus: "학생",
    focusRomanization: "haksaeng",
    focusMeaning: "student",
    grammarTitle: "Topic + identity",
    grammarTip:
      "저는 sets 저 as the topic. Add -이에요 after a consonant-ending noun to say am / is.",
  },
  {
    korean: "저는 미국 사람이에요",
    romanization: "jeoneun miguk saramieyo",
    meaning: "I’m American.",
    focus: "사람",
    focusRomanization: "saram",
    focusMeaning: "person",
    grammarTitle: "Person and identity",
    grammarTip:
      "사람 means person. The phrase 나라 사람 can describe someone’s nationality.",
  },
  {
    korean: "이름이 뭐예요?",
    romanization: "ireumi mwoyeyo",
    meaning: "What’s your name?",
    focus: "이름",
    focusRomanization: "ireum",
    focusMeaning: "name",
    grammarTitle: "Ask what something is",
    grammarTip:
      "뭐예요? means what is it? 이 marks 이름 as the subject because it ends in a consonant.",
  },
  {
    korean: "만나서 반가워요",
    romanization: "mannaseo bangawoyo",
    meaning: "Nice to meet you.",
    focus: "만나다",
    focusRomanization: "mannada",
    focusMeaning: "to meet",
    grammarTitle: "A warm introduction",
    grammarTip:
      "만나서 links meeting with the feeling that follows: pleased to meet you.",
  },
  {
    korean: "감사합니다",
    romanization: "gamsahamnida",
    meaning: "Thank you. (polite)",
    focus: "감사",
    focusRomanization: "gamsa",
    focusMeaning: "thanks; gratitude",
    grammarTitle: "Polite thanks",
    grammarTip: "감사합니다 is a standard, polite way to thank someone.",
  },
  {
    korean: "죄송합니다",
    romanization: "joesonghamnida",
    meaning: "I’m sorry. (polite)",
    focus: "죄송",
    focusRomanization: "joesong",
    focusMeaning: "being sorry",
    grammarTitle: "A polite apology",
    grammarTip:
      "죄송합니다 is a respectful apology. 미안해요 is another common polite option.",
  },
  {
    korean: "괜찮아요",
    romanization: "gwaenchanayo",
    meaning: "It’s okay. / I’m fine.",
    focus: "괜찮다",
    focusRomanization: "gwaenchanta",
    focusMeaning: "to be okay",
    grammarTitle: "Check how someone feels",
    grammarTip: "괜찮아요 can reassure someone or say that you are doing okay.",
  },
  {
    korean: "물 주세요",
    romanization: "mul juseyo",
    meaning: "Water, please.",
    focus: "주세요",
    focusRomanization: "juseyo",
    focusMeaning: "please give me",
    grammarTitle: "A useful request",
    grammarTip: "Put a noun before 주세요 to politely ask for it: 물 주세요.",
  },
  {
    korean: "커피 한 잔 주세요",
    romanization: "keopi han jan juseyo",
    meaning: "One cup of coffee, please.",
    focus: "한 잔",
    focusRomanization: "han jan",
    focusMeaning: "one cup",
    grammarTitle: "Count a cup",
    grammarTip:
      "한 is the native Korean form of one used before counters. 잔 counts cups or glasses.",
  },
  {
    korean: "메뉴 좀 주세요",
    romanization: "menyu jom juseyo",
    meaning: "Could I have the menu, please?",
    focus: "좀",
    focusRomanization: "jom",
    focusMeaning: "a little; softening request",
    grammarTitle: "Soften a request",
    grammarTip:
      "좀 literally means a little, and often makes a request sound gentler.",
  },
  {
    korean: "이거 얼마예요?",
    romanization: "igeo eolmayeyo",
    meaning: "How much is this?",
    focus: "얼마",
    focusRomanization: "eolma",
    focusMeaning: "how much",
    grammarTitle: "Ask the price",
    grammarTip:
      "얼마예요? asks how much something costs. 이거 means this thing.",
  },
  {
    korean: "화장실이 어디예요?",
    romanization: "hwajangsiri eodiyeyo",
    meaning: "Where is the restroom?",
    focus: "어디",
    focusRomanization: "eodi",
    focusMeaning: "where",
    grammarTitle: "Ask where",
    grammarTip:
      "어디예요? means where is it? The subject marker 이 follows the consonant-ending 화장실.",
  },
  {
    korean: "오늘 날씨가 좋아요",
    romanization: "oneul nalssiga joayo",
    meaning: "The weather is nice today.",
    focus: "오늘",
    focusRomanization: "oneul",
    focusMeaning: "today",
    grammarTitle: "Subject marker",
    grammarTip: "날씨 ends in a vowel sound, so 가 marks it as the subject.",
  },
  {
    korean: "지금 학교에 가요",
    romanization: "jigeum hakgyoe gayo",
    meaning: "I’m going to school now.",
    focus: "에",
    focusRomanization: "e",
    focusMeaning: "to; at",
    grammarTitle: "Mark a destination",
    grammarTip: "Add 에 after a destination: 학교에 가요 means go to school.",
  },
  {
    korean: "집에서 공부해요",
    romanization: "jibeseo gongbuhaeyo",
    meaning: "I study at home.",
    focus: "에서",
    focusRomanization: "eseo",
    focusMeaning: "at a place of action",
    grammarTitle: "Where an action happens",
    grammarTip:
      "Use 에서 for the place where an action takes place: 집에서 공부해요.",
  },
  {
    korean: "친구와 만나요",
    romanization: "chinguwa mannayo",
    meaning: "I meet with a friend.",
    focus: "친구",
    focusRomanization: "chingu",
    focusMeaning: "friend",
    grammarTitle: "Say “with”",
    grammarTip:
      "와 follows a vowel-ending noun to mean and or with. 과 follows a consonant-ending noun.",
  },
  {
    korean: "사과를 먹어요",
    romanization: "sagwareul meogeoyo",
    meaning: "I eat an apple.",
    focus: "먹다",
    focusRomanization: "meokda",
    focusMeaning: "to eat",
    grammarTitle: "Mark the object",
    grammarTip: "를 marks 사과 as the object because 사과 ends in a vowel.",
  },
  {
    korean: "차를 마셔요",
    romanization: "chareul masyeoyo",
    meaning: "I drink tea.",
    focus: "마시다",
    focusRomanization: "masida",
    focusMeaning: "to drink",
    grammarTitle: "A polite present verb",
    grammarTip: "마시다 becomes 마셔요 in this common polite present form.",
  },
  {
    korean: "영화를 봐요",
    romanization: "yeonghwareul bwayo",
    meaning: "I watch a movie.",
    focus: "보다",
    focusRomanization: "boda",
    focusMeaning: "to see; to watch",
    grammarTitle: "A contracted verb",
    grammarTip: "보다 becomes 봐요 in polite present speech.",
  },
  {
    korean: "음악을 좋아해요",
    romanization: "eumageul joahaeyo",
    meaning: "I like music.",
    focus: "좋아하다",
    focusRomanization: "joahada",
    focusMeaning: "to like",
    grammarTitle: "Say what you like",
    grammarTip:
      "좋아하다 is a verb meaning to like. Use 을 after a consonant-ending object.",
  },
  {
    korean: "천천히 말해 주세요",
    romanization: "cheoncheonhi malhae juseyo",
    meaning: "Please speak slowly.",
    focus: "천천히",
    focusRomanization: "cheoncheonhi",
    focusMeaning: "slowly",
    grammarTitle: "Ask someone to do something",
    grammarTip:
      "Verb stem + 아/어 주세요 makes a polite request. 천천히 means slowly.",
  },
  {
    korean: "다시 말해 주세요",
    romanization: "dasi malhae juseyo",
    meaning: "Please say it again.",
    focus: "다시",
    focusRomanization: "dasi",
    focusMeaning: "again",
    grammarTitle: "Ask for a repeat",
    grammarTip:
      "다시 means again. Pair it with 말해 주세요 to politely ask someone to repeat.",
  },
  {
    korean: "내일 만나요",
    romanization: "naeil mannayo",
    meaning: "See you tomorrow.",
    focus: "내일",
    focusRomanization: "naeil",
    focusMeaning: "tomorrow",
    grammarTitle: "Meet tomorrow",
    grammarTip:
      "내일 means tomorrow. Korean often leaves out the subject when context makes it clear.",
  },
];

export const speakingCards: SpeakingCard[] = phrases.map((phrase, index) => {
  const id = `speak-${String(index + 1).padStart(2, "0")}`;
  const shared = {
    korean: phrase.korean,
    romanization: phrase.romanization,
    meaning: phrase.meaning,
    focus: phrase.focus,
    focusRomanization: phrase.focusRomanization,
    focusMeaning: phrase.focusMeaning,
    grammarTitle: phrase.grammarTitle,
    grammarTip: phrase.grammarTip,
  };
  return {
    ...shared,
    id: `${id}-phrase`,
    kind: "phrase",
    promptLabel: phrase.grammarTitle,
    prompt: phrase.korean,
  };
});

const letterCards: SpeakingCard[] = hangulLetters.map((entry) => ({
  id: `speak-letter-${entry.korean}`,
  kind: "pronunciation",
  promptLabel: "A familiar letter",
  prompt: entry.korean,
  korean: entry.korean,
  romanization: entry.romanization,
  meaning: entry.meaning,
  focus: entry.korean,
  focusRomanization: entry.romanization,
  focusMeaning: entry.meaning,
  grammarTitle: "Notice the letter and sound",
  grammarTip:
    "Listen to the Korean letter name or vowel sound, then repeat. English sound cues are approximate.",
}));
const wordCards: SpeakingCard[] = [...journeyTopics, {
  id: "first-readable", title: "Your first readable words",
  items: lessons.find(lesson => lesson.id === "first-readable-words")!.questions.map(question => [question.korean, question.answer]),
}].flatMap(topic => topic.items.map(([word, meaning], index) => ({
  id: `speak-word-${topic.id}-${index}`, lessonId: `${topic.id}-words`, kind: "word" as const,
  promptLabel: topic.title, prompt: word, korean: word, romanization: transcriptRomanization(word), meaning,
  focus: word, focusRomanization: transcriptRomanization(word), focusMeaning: meaning,
  grammarTitle: "One word at a time",
  grammarTip: "Connect this word with its meaning, listen, then say it from memory. Sentence practice comes after the vocabulary lesson.",
})));
const topicExampleCards: SpeakingCard[] = journeyTopics.filter(topic=>topic.pathwayId).flatMap(topic=>topic.items.map(([word,meaning,example,translation],index)=>({
  id:`speak-example-${topic.id}-${index}`,lessonId:`${topic.id}-dialogue`,kind:"phrase" as const,
  promptLabel:topic.title,prompt:example,korean:example,romanization:transcriptRomanization(example),meaning:translation,
  focus:word,focusRomanization:transcriptRomanization(word),focusMeaning:meaning,
  grammarTitle:"One familiar word, one useful sentence",
  grammarTip:`${word} means ${meaning} in this chapter. Listen to the whole sentence, then recall it before revealing the guide.`,
})));
const conversationCards: SpeakingCard[] = [...topicExampleCards,...lessons
  .filter(
    (lesson) =>
      lesson.category === "Conversation" &&
      lesson.briefing &&
      /^[가-힣][가-힣\s,.!?]*$/u.test(lesson.briefing.example),
  )
  .map((lesson): SpeakingCard => ({
    id: `speak-lesson-${lesson.id}`,
    lessonId: lesson.id,
    kind: "phrase",
    promptLabel: lesson.title,
    prompt: lesson.briefing!.example,
    korean: lesson.briefing!.example,
    romanization: transcriptRomanization(lesson.briefing!.example),
    meaning: lesson.briefing!.translation,
    focus: lesson.briefing!.example,
    focusRomanization: transcriptRomanization(lesson.briefing!.example),
    focusMeaning: lesson.briefing!.translation,
    grammarTitle: lesson.briefing!.focus,
    grammarTip: lesson.briefing!.explanation,
  }))];
const opinionCards: SpeakingCard[] = opinionSpeaking.map(([id,korean,meaning,focus,focusMeaning,grammarTip])=>({
  id:`speak-opinion-${id}`,lessonId:"opinions-dialogue",kind:"phrase",promptLabel:"Opinions and connected ideas",
  prompt:korean,korean,meaning,romanization:transcriptRomanization(korean),focus,focusMeaning,
  focusRomanization:transcriptRomanization(focus),grammarTitle:"Give a view, then connect an idea",grammarTip,
}));

export function speakingCardsForProfile(
  profile: LearningProfile,
  completed: string[],
) {
  if (
    profile.level === "new"
  ) {
    const next = recommendedLessons(completed, profile)[0];
    const ids = new Set([...completed, ...(next ? [next.id] : [])]);
    const covered = new Set(
      lessons
        .filter((lesson) => ids.has(lesson.id))
        .flatMap((lesson) => lesson.words),
    );
    return letterCards.filter((card) => covered.has(card.korean));
  }
  if(profile.level === "advanced") return opinionCards;
  const route = new Map(
    learningRoute(profile).map((lesson, index) => [lesson.id, index]),
  );
  const conversational = profile.level === "intermediate";
  const extras = conversationCards
          .filter((card) => {
            const lesson = lessons.find(
              (item) => item.id === card.lessonId,
            )!;
            const prerequisites = lesson.prerequisiteLessonIds ?? [];
            const practiced = completed.includes(lesson.id) || (prerequisites.length > 0 && prerequisites.every(id => completed.includes(id)));
            const matchingLevel = conversational ? lesson.level === "intermediate" : profile.level === "basic" && lesson.level === "foundation";
            return matchingLevel && (conversational || practiced) && isLessonUnlocked(
              lesson,
              completed,
              placementKnowledge(profile),
            );
          })
          .sort(
            (left, right) =>
              (route.get(left.lessonId!) ?? 999) -
              (route.get(right.lessonId!) ?? 999),
          );
  const wordLessonIds = new Set([
    ...completed,
    "first-readable-words",
    ...recommendedLessons(completed, profile).filter(lesson => lesson.category === "Vocabulary").slice(0, 3).map(lesson => lesson.id),
  ]);
  const words = wordCards.filter(card => wordLessonIds.has(card.lessonId!))
    .sort((left, right) => (route.get(left.lessonId!) ?? 999) - (route.get(right.lessonId!) ?? 999));
  // A vocabulary placement must not inherit the shared full-sentence deck.
  const deck = conversational ? extras : [...words, ...extras];
  return [...new Map(deck.map((card) => [card.korean, card])).values()];
}
const speakingCardIds = new Set(
  [...speakingCards, ...letterCards, ...wordCards, ...conversationCards, ...opinionCards].map(
    (card) => card.id,
  ),
);

export function normalizeSpeakingCardId(id: string | null): string | null {
  if (!id) return null;
  if (speakingCardIds.has(id)) return id;
  const legacy = /^(speak-\d{2})-(?:sound|grammar|recall)$/u.exec(id);
  const migrated = legacy ? `${legacy[1]}-phrase` : null;
  return migrated && speakingCardIds.has(migrated) ? migrated : null;
}

export function normalizeSpeakingCardIds(ids: string[]): string[] {
  return [
    ...new Set(
      ids
        .map(normalizeSpeakingCardId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}
