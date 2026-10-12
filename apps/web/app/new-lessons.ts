import type { Lesson } from "./curriculum";
// App-authored practice using existing beginner vocabulary. Dictionary lookup
// and corpus references remain available from every exercise.
export const newLessons: Lesson[] = [
  {
    id: "shopping-prices", title: "Shopping: ask and order", detail: "Ask a price, request a menu, and order politely", category: "Conversation", minutes: 18,
    pathwayId: "everyday", level: "foundation", prerequisiteLessonIds: ["ask-a-question"], words: ["얼마", "물", "커피", "메뉴", "주세요"],
    briefing: { focus: "Ask about a price and make a polite request.", explanation: "이거 얼마예요? asks how much this costs. Put what you want before 주세요. Add 좀 to soften a request.", useWhen: "Use these patterns in a café or shop.", example: "물 좀 주세요.", translation: "Please give me some water.", watchFor: "Keep the polite ending when talking to shop staff. 이거 and 이것 refer to this thing; choose wording appropriate to the context." },
    questions: [
      { id: "shop-price", type: "choice", korean: "이거 얼마예요?", prompt: "What information are you asking for?", choices: ["the price", "the location", "the time"], answer: "the price", tip: "얼마 asks about an amount; here it asks the price." },
      { id: "shop-water", type: "text", korean: "물 ___", prompt: "Complete a polite request for water.", answer: "주세요", accepted: [], placeholder: "Korean ending", tip: "물 주세요 means water, please." },
      { id: "shop-soften", type: "choice", korean: "메뉴 좀 주세요.", prompt: "What does 좀 do in this request?", choices: ["softens the request", "makes it past tense", "asks where"], answer: "softens the request", tip: "좀 often makes a request gentler." },
      { id: "shop-menu", type: "text", korean: "메뉴 주세요.", prompt: "Write a polite request for the menu.", answer: "메뉴 주세요", accepted: ["메뉴 좀 주세요", "메뉴를 주세요"], placeholder: "Korean sentence", tip: "메뉴 is menu; 주세요 is a polite request to give something." },
      { id: "shop-not-location", type: "choice", korean: "커피 얼마예요?", prompt: "Choose the natural English meaning.", choices: ["How much is the coffee?", "Where is the coffee?", "I drank coffee."], answer: "How much is the coffee?", tip: "얼마예요 asks a price, not a place." },
      { id: "shop-coffee", type: "text", korean: "커피 주세요.", prompt: "Ask politely for coffee.", answer: "커피 주세요", accepted: ["커피 좀 주세요", "커피를 주세요"], placeholder: "Korean sentence", tip: "Name the item, then add 주세요." },
    ],
  },
  {
    id: "travel-find-places", title: "Travel: find your way", detail: "Ask where places are and describe a destination", category: "Conversation", minutes: 18,
    pathwayId: "everyday", level: "foundation", prerequisiteLessonIds: ["places-around-you"], words: ["어디", "학교", "집", "가다", "은행"],
    briefing: { focus: "Distinguish a place question from a destination.", explanation: "어디예요? asks where something is. A destination takes 에, as in 학교에 가요. 가요 is the polite present form of 가다.", useWhen: "Ask where a bank is or say where you are going.", example: "은행이 어디예요?", translation: "Where is the bank?", watchFor: "에 marks a destination here; 에서 marks where an action takes place." },
    questions: [
      { id: "travel-bank", type: "choice", korean: "은행이 어디예요?", prompt: "What is being asked?", choices: ["Where is the bank?", "How much is the bank?", "Who is at school?"], answer: "Where is the bank?", tip: "은행 means bank; 어디 asks where." },
      { id: "travel-destination", type: "text", korean: "학교__ 가요.", prompt: "Add the destination particle.", answer: "에", accepted: [], placeholder: "Particle", tip: "학교에 가요 means go to school." },
      { id: "travel-home", type: "text", korean: "집에 가요.", prompt: "Write I go home in polite Korean.", answer: "집에 가요", accepted: ["저는 집에 가요"], placeholder: "Korean sentence", tip: "집 is home and 에 marks the destination." },
      { id: "travel-verb", type: "choice", korean: "가다 → ?", prompt: "Choose the polite present form.", choices: ["가요", "가다요", "갔어요"], answer: "가요", tip: "가다 becomes 가요; 갔어요 is past tense." },
      { id: "travel-where", type: "text", korean: "학교가 어디예요?", prompt: "Ask where the school is.", answer: "학교가 어디예요", accepted: ["학교는 어디예요", "학교 어디예요"], placeholder: "Korean question", tip: "학교 ends in a vowel, so 가 can mark it as the subject." },
    ],
  },
  {
    id: "family-short-introductions", title: "Family: introduce someone", detail: "Introduce family and friends with polite identity sentences", category: "Conversation", minutes: 18,
    pathwayId: "everyday", level: "foundation", prerequisiteLessonIds: ["family-and-friends"], words: ["가족", "엄마", "아빠", "친구", "사람"],
    briefing: { focus: "Introduce a person with 이에요 or 예요.", explanation: "Use 이에요 after a consonant-ending noun and 예요 after a vowel-ending noun. 제 means my in a humble form. 제 친구예요 introduces my friend.", useWhen: "Introduce people close to you.", example: "제 친구예요.", translation: "This is my friend.", watchFor: "엄마 and 아빠 are familiar family terms. 어머니 and 아버지 are more formal alternatives." },
    questions: [
      { id: "family-friend", type: "choice", korean: "제 친구예요.", prompt: "Choose the meaning.", choices: ["This is my friend.", "Where is my friend?", "My friend goes home."], answer: "This is my friend.", tip: "제 is my; 친구예요 identifies the person as a friend." },
      { id: "family-ending", type: "text", korean: "가족___", prompt: "Add the polite identity ending after 가족.", answer: "이에요", accepted: [], placeholder: "Korean ending", tip: "가족 ends in a consonant, so use 이에요." },
      { id: "family-mom", type: "text", korean: "제 엄마예요.", prompt: "Write This is my mom.", answer: "제 엄마예요", accepted: ["저의 엄마예요"], placeholder: "Korean sentence", tip: "엄마 ends in a vowel; attach 예요." },
      { id: "family-formality", type: "choice", korean: "아빠 / 아버지", prompt: "Which term is more formal?", choices: ["아버지", "아빠", "both always have the same register"], answer: "아버지", tip: "아빠 is familiar; 아버지 is more formal." },
      { id: "family-person", type: "text", korean: "좋은 사람이에요.", prompt: "Write the noun meaning person.", answer: "사람", accepted: [], placeholder: "Korean noun", tip: "사람 means person." },
    ],
  },
];
