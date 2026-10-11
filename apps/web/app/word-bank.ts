export type WordCategory =
  | "Greetings"
  | "People"
  | "Food & drink"
  | "Everyday"
  | "Nouns"
  | "Verbs"
  | "Adjectives"
  | "Adverbs"
  | "Phrases"
  | "Grammar"
  | "Numbers"
  | "Hangul"
  | "Other";

export type KoreanWord = {
  id: string;
  korean: string;
  romanization: string;
  meaning: string;
  category: WordCategory;
  example: string;
  exampleTranslation?: string;
  source?: string;
  license?: string;
  reviewStatus?: "unreviewed" | "editor_review_required" | "editor_reviewed" | "curated";
};

export const wordCategories: WordCategory[] = [
  "Greetings",
  "People",
  "Food & drink",
  "Everyday",
  "Nouns",
  "Verbs",
  "Adjectives",
  "Adverbs",
  "Phrases",
  "Grammar",
  "Numbers",
  "Hangul",
  "Other",
];

export const wordBank: KoreanWord[] = [
  {
    id: "hello-polite",
    korean: "안녕하세요",
    romanization: "annyeonghaseyo",
    meaning: "hello (polite)",
    category: "Greetings",
    example: "안녕하세요! 만나서 반가워요.",
  },
  {
    id: "hello-casual",
    korean: "안녕",
    romanization: "annyeong",
    meaning: "hi / bye (casual)",
    category: "Greetings",
    example: "안녕, 내일 봐!",
  },
  {
    id: "thanks",
    korean: "감사합니다",
    romanization: "gamsahamnida",
    meaning: "thank you",
    category: "Greetings",
    example: "도와줘서 감사합니다.",
  },
  {
    id: "sorry",
    korean: "죄송합니다",
    romanization: "joesonghamnida",
    meaning: "I'm sorry (polite)",
    category: "Greetings",
    example: "늦어서 죄송합니다.",
  },
  {
    id: "goodbye",
    korean: "안녕히 가세요",
    romanization: "annyeonghi gaseyo",
    meaning: "goodbye (to someone leaving)",
    category: "Greetings",
    example: "안녕히 가세요. 다음에 봐요.",
  },
  {
    id: "please",
    korean: "주세요",
    romanization: "juseyo",
    meaning: "please give me",
    category: "Greetings",
    example: "물 주세요.",
  },
  {
    id: "me",
    korean: "저",
    romanization: "jeo",
    meaning: "I / me (polite)",
    category: "People",
    example: "저는 학생이에요.",
  },
  {
    id: "friend",
    korean: "친구",
    romanization: "chingu",
    meaning: "friend",
    category: "People",
    example: "친구를 만나요.",
  },
  {
    id: "student",
    korean: "학생",
    romanization: "haksaeng",
    meaning: "student",
    category: "People",
    example: "저는 학생이에요.",
  },
  {
    id: "name",
    korean: "이름",
    romanization: "ireum",
    meaning: "name",
    category: "People",
    example: "이름이 뭐예요?",
  },
  {
    id: "person",
    korean: "사람",
    romanization: "saram",
    meaning: "person",
    category: "People",
    example: "좋은 사람이에요.",
  },
  {
    id: "family",
    korean: "가족",
    romanization: "gajok",
    meaning: "family",
    category: "People",
    example: "가족과 살아요.",
  },
  {
    id: "water",
    korean: "물",
    romanization: "mul",
    meaning: "water",
    category: "Food & drink",
    example: "물 한 잔 주세요.",
  },
  {
    id: "rice",
    korean: "밥",
    romanization: "bap",
    meaning: "cooked rice / meal",
    category: "Food & drink",
    example: "밥 먹었어요?",
  },
  {
    id: "milk",
    korean: "우유",
    romanization: "uyu",
    meaning: "milk",
    category: "Food & drink",
    example: "우유를 좋아해요.",
  },
  {
    id: "coffee",
    korean: "커피",
    romanization: "keopi",
    meaning: "coffee",
    category: "Food & drink",
    example: "커피 한 잔 주세요.",
  },
  {
    id: "fruit",
    korean: "과일",
    romanization: "gwail",
    meaning: "fruit",
    category: "Food & drink",
    example: "과일을 먹어요.",
  },
  {
    id: "bread",
    korean: "빵",
    romanization: "ppang",
    meaning: "bread",
    category: "Food & drink",
    example: "빵하고 우유를 사요.",
  },
  {
    id: "home",
    korean: "집",
    romanization: "jip",
    meaning: "home / house",
    category: "Everyday",
    example: "집에 가요.",
  },
  {
    id: "school",
    korean: "학교",
    romanization: "hakgyo",
    meaning: "school",
    category: "Everyday",
    example: "학교에 가요.",
  },
  {
    id: "today",
    korean: "오늘",
    romanization: "oneul",
    meaning: "today",
    category: "Everyday",
    example: "오늘은 바빠요.",
  },
  {
    id: "smile",
    korean: "미소",
    romanization: "miso",
    meaning: "smile",
    category: "Everyday",
    example: "미소가 예뻐요.",
  },
  {
    id: "tomorrow",
    korean: "내일",
    romanization: "naeil",
    meaning: "tomorrow",
    category: "Everyday",
    example: "내일 만나요.",
  },
  {
    id: "bag",
    korean: "가방",
    romanization: "gabang",
    meaning: "bag",
    category: "Everyday",
    example: "가방이 있어요.",
  },
  {
    id: "book",
    korean: "책",
    romanization: "chaek",
    meaning: "book",
    category: "Everyday",
    example: "책을 읽어요.",
  },
];
