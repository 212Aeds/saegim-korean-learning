import type { Lesson } from "./curriculum";
import type { KoreanWord } from "./word-bank";
import { transcriptRomanization } from "./ui/transcript-romanization";
// App-authored teaching adaptations of dictionary senses. Examples await editorial review.
type Topic = {
  id: string;
  title: string;
  category: KoreanWord["category"];
  items: Array<[string, string, string, string]>;
  dialogue: [string, string];
};
export const journeyTopics: Topic[] = [
  {
    id: "food",
    title: "Food and meals",
    category: "Food & drink",
    items: [
      ["아침", "morning; breakfast", "아침을 먹어요.", "I eat breakfast."],
      ["점심", "lunch", "점심을 먹어요.", "I eat lunch."],
      ["저녁", "evening; dinner", "저녁에 만나요.", "We meet in the evening."],
      ["음식", "food", "음식이 맛있어요.", "The food is delicious."],
      ["식당", "restaurant", "식당에 가요.", "I go to a restaurant."],
      ["채소", "vegetables", "채소를 먹어요.", "I eat vegetables."],
    ],
    dialogue: ["식당에서 점심을 먹어요.", "I eat lunch at a restaurant."],
  },
  {
    id: "transport",
    title: "Transport and arrivals",
    category: "Everyday",
    items: [
      ["지하철", "subway", "지하철을 타요.", "I take the subway."],
      ["버스", "bus", "버스를 타요.", "I take the bus."],
      ["역", "station", "역이 어디예요?", "Where is the station?"],
      ["표", "ticket", "표를 사요.", "I buy a ticket."],
      ["공항", "airport", "공항에 가요.", "I go to the airport."],
      ["여권", "passport", "여권이 있어요.", "I have a passport."],
    ],
    dialogue: [
      "공항에 가요. 지하철을 타요.",
      "I am going to the airport. I take the subway.",
    ],
  },
  {
    id: "neighborhood",
    title: "Around your neighborhood",
    category: "Everyday",
    items: [
      ["우체국", "post office", "우체국에 가요.", "I go to the post office."],
      [
        "편의점",
        "convenience store",
        "편의점에서 물을 사요.",
        "I buy water at a convenience store.",
      ],
      ["시장", "market", "시장에 가요.", "I go to the market."],
      ["공원", "park", "공원에서 걸어요.", "I walk in the park."],
      ["은행", "bank", "은행이 어디예요?", "Where is the bank?"],
      ["도서관", "library", "도서관에서 공부해요.", "I study at the library."],
    ],
    dialogue: ["우체국이 어디예요?", "Where is the post office?"],
  },
  {
    id: "health",
    title: "Health and practical help",
    category: "Everyday",
    items: [
      ["병원", "hospital", "병원이 어디예요?", "Where is the hospital?"],
      ["약", "medicine", "약이 있어요.", "There is medicine."],
      ["약국", "pharmacy", "약국에 가요.", "I go to a pharmacy."],
      ["건강", "health", "건강이 중요해요.", "Health is important."],
      ["물", "water", "물을 마셔요.", "I drink water."],
      ["우산", "umbrella", "우산이 필요해요.", "I need an umbrella."],
    ],
    dialogue: ["약국이 어디예요?", "Where is the pharmacy?"],
  },
  {
    id: "work",
    title: "Work and colleagues",
    category: "People",
    items: [
      ["회의", "meeting", "회의는 내일이에요.", "The meeting is tomorrow."],
      ["회사", "company", "회사가 여기에 있어요.", "The company is here."],
      ["직원", "employee", "직원이 많아요.", "There are many employees."],
      [
        "동료",
        "colleague",
        "동료와 점심을 먹어요.",
        "I have lunch with a colleague.",
      ],
      ["시간", "time", "시간이 있어요.", "I have time."],
      ["계획", "plan", "계획이 있어요.", "I have a plan."],
    ],
    dialogue: ["내일 회의가 있어요.", "There is a meeting tomorrow."],
  },
  {
    id: "study",
    title: "Study and exam vocabulary",
    category: "Everyday",
    items: [
      ["시험", "exam", "시험이 어려워요.", "The exam is difficult."],
      ["문제", "problem; question", "문제가 쉬워요.", "The question is easy."],
      ["답", "answer", "답을 알아요.", "I know the answer."],
      ["질문", "question", "질문이 있어요.", "I have a question."],
      ["연습", "practice", "매일 연습해요.", "I practice every day."],
      ["공부", "study", "한국어를 공부해요.", "I study Korean."],
    ],
    dialogue: [
      "질문이 있어요. 다시 말해 주세요.",
      "I have a question. Please say it again.",
    ],
  },
  {
    id: "hobbies",
    title: "Hobbies and shared interests",
    category: "Everyday",
    items: [
      ["취미", "hobby", "취미가 뭐예요?", "What is your hobby?"],
      ["여행", "travel", "여행을 좋아해요.", "I like traveling."],
      ["사진", "photo", "사진을 찍어요.", "I take a photo."],
      ["노래", "song", "노래를 들어요.", "I listen to a song."],
      ["문화", "culture", "한국 문화를 좋아해요.", "I like Korean culture."],
      ["영화", "movie", "영화를 봐요.", "I watch a movie."],
    ],
    dialogue: ["제 취미는 여행이에요.", "My hobby is traveling."],
  },
  {
    id: "opinions",
    title: "Opinions and reasons",
    category: "Everyday",
    items: [
      ["의견", "opinion", "의견이 있어요.", "I have an opinion."],
      ["이유", "reason", "이유가 뭐예요?", "What is the reason?"],
      ["경험", "experience", "좋은 경험이었어요.", "It was a good experience."],
      [
        "환경",
        "environment",
        "환경이 중요해요.",
        "The environment is important.",
      ],
      ["선택", "choice", "좋은 선택이에요.", "It is a good choice."],
      [
        "생각",
        "thought; idea",
        "생각이 달라요.",
        "Our thoughts are different.",
      ],
    ],
    dialogue: [
      "제 생각에는 건강이 중요해요.",
      "In my opinion, health is important.",
    ],
  },
];
export const journeyVocabulary: KoreanWord[] = journeyTopics.flatMap((topic) =>
  topic.items.map(([korean, meaning, example, exampleTranslation]) => ({
    id: `journey-${topic.id}-${korean}`,
    korean,
    meaning,
    romanization: transcriptRomanization(korean),
    category: topic.category,
    example,
    exampleTranslation,
    source: "cc-kedict",
    license: "CC BY-SA 3.0",
    reviewStatus: "editor_review_required",
  })),
);
export const journeyLessons: Lesson[] = journeyTopics.flatMap((topic) => {
  const vocabularyQuestions = topic.items.flatMap(
    ([korean, meaning, example, translation], index) => [
      {
        id: `${topic.id}-meaning-${index}`,
        type: "choice" as const,
        korean,
        prompt: "Choose the meaning used in this lesson.",
        choices: [
          meaning,
          ...topic.items
            .filter((item) => item[1] !== meaning)
            .slice(0, 3)
            .map((item) => item[1]),
        ],
        answer: meaning,
        tip: `${korean}: ${meaning}.`,
      },
      {
        id: `word-hangul-${topic.id}-write-${index}`,
        type: "text" as const,
        korean,
        prompt: `Write the Korean word for ${meaning}.`,
        answer: korean,
        accepted: [],
        placeholder: "Korean word",
        tip: `${korean}: ${meaning}.`,
      },
    ],
  );
  const dialogueQuestions = topic.items.map(
    ([korean, meaning, example, translation], index) => ({
      id: `${topic.id}-sentence-${index}`,
      type: "choice" as const,
      korean: example,
      prompt: "Choose what this sentence means.",
      choices: [
        translation,
        ...topic.items
          .filter((item) => item[3] !== translation)
          .slice(0, 3)
          .map((item) => item[3]),
      ],
      answer: translation,
      tip: `${example} ${translation}`,
    }),
  );
  const advanced = topic.id === "opinions";
  return [
    {
      id: `${topic.id}-words`,
      title: `${topic.title}: words`,
      detail: "Six useful words, with meanings and writing practice",
      category: "Vocabulary",
      minutes: 10,
      pathwayId: "everyday",
      level: "foundation",
      prerequisiteLessonIds: ["hello-there"],
      words: topic.items.map((item) => item[0]),
      authoredOnly: true,
      briefing: {
        focus: `Meet six words for ${topic.title.toLowerCase()}.`,
        explanation:
          "Read each word, connect it with a meaning, then recall its Korean spelling. The examples show one contextual sense; words can have other dictionary meanings.",
        useWhen:
          "Use these words when you encounter this topic in everyday Korean.",
        example: topic.items[0][2],
        translation: topic.items[0][3],
      },
      questions: vocabularyQuestions,
    },
    {
      id: `${topic.id}-dialogue`,
      title: `${topic.title}: exchanges`,
      detail: "Understand familiar words in complete, polite sentences",
      category: "Conversation",
      minutes: 12,
      pathwayId: advanced ? "stretch" : "everyday",
      level: advanced ? "stretch" : "intermediate",
      prerequisiteLessonIds: [
        `${topic.id}-words`,
        advanced ? "connect-with-go" : "polite-present",
      ],
      words: topic.items.map((item) => item[0]),
      authoredOnly: true,
      briefing: {
        focus: "Move from single words to useful sentences.",
        explanation: advanced
          ? "제 생각에는 introduces a personal view. Connect an idea with a reason in conversation; the app can help you explore wording."
          : "Pay attention to the final polite ending and to 에 for a destination or 에서 for a place where an action happens. Some examples ask a question or describe what exists.",
        useWhen:
          "Practice these sentences before trying a conversation about this topic.",
        example: topic.dialogue[0],
        translation: topic.dialogue[1],
      },
      questions: [
        ...dialogueQuestions,
        {
          id: `word-hangul-${topic.id}-produce`,
          type: "text",
          korean: topic.dialogue[0],
          prompt: `Write this polite Korean sentence: ${topic.dialogue[1]}`,
          answer: topic.dialogue[0],
          accepted: [],
          placeholder: "Your Korean sentence",
          tip: `One target wording: ${topic.dialogue[0]}`,
        },
      ],
    },
  ];
});
