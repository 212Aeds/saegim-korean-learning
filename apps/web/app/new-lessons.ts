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
  {
    id: "conversation-weekend", title: "Conversation: your weekend", detail: "Answer a question, add detail, and ask it back", category: "Conversation", minutes: 12,
    pathwayId: "stretch", level: "intermediate", prerequisiteLessonIds: ["polite-past"], generatedPracticeOnly: true, words: ["주말", "친구", "영화"],
    briefing: { focus: "Keep a short conversation moving.", explanation: "Answer 주말에 뭐 했어요? with a past-tense action, then ask the other person about their weekend with 주말에 뭐 했어요? A connected reply can use -고 to link two actions.", useWhen: "Catch up with someone after the weekend.", example: "친구를 만나고 영화를 봤어요.", translation: "I met a friend and watched a movie.", watchFor: "These are app-authored dialogues for practice, not source quotations. Polite 요 endings suit a casual but polite exchange." },
    questions: [
      { id: "weekend-understand", type: "choice", korean: "주말에 뭐 했어요?", prompt: "Your partner asks this. What are they asking about?", choices: ["What you did over the weekend", "Your plans for next year", "Where your friend lives"], answer: "What you did over the weekend", tip: "했어요 is past tense; 주말 is weekend." },
      { id: "weekend-reply", type: "text", korean: "영화를 봤어요.", prompt: "Reply: I watched a movie.", answer: "영화를 봤어요", accepted: ["영화 봤어요", "저는 영화를 봤어요"], placeholder: "Your Korean reply", tip: "보다 becomes 봤어요 in the polite past." },
      { id: "weekend-connect", type: "choice", korean: "친구를 만나고 영화를 봤어요.", prompt: "What did your partner do?", choices: ["Met a friend and watched a movie", "Stayed home and studied", "Bought coffee for a friend"], answer: "Met a friend and watched a movie", tip: "-고 connects 만나다 with the next action." },
      { id: "weekend-ask-back", type: "text", korean: "주말에 뭐 했어요?", prompt: "Ask your partner what they did over the weekend.", answer: "주말에 뭐 했어요", accepted: ["주말에 무엇을 했어요", "주말에 뭘 했어요"], placeholder: "Korean question", tip: "뭐, 뭘, and 무엇을 can ask what in this context." },
    ],
  },
  {
    id: "conversation-cafe", title: "Conversation: at the café", detail: "Respond to a follow-up while ordering", category: "Conversation", minutes: 12,
    pathwayId: "stretch", level: "intermediate", prerequisiteLessonIds: ["polite-present"], generatedPracticeOnly: true, words: ["커피", "물", "주세요"],
    briefing: { focus: "Handle both turns of a café exchange.", explanation: "After you order, staff might ask 여기서 드세요? (Are you having it here?). You can answer 네, 여기서 마실게요. to say you will drink it here.", useWhen: "Order a drink and answer the staff's follow-up.", example: "네, 여기서 마실게요.", translation: "Yes, I’ll drink it here.", watchFor: "드세요 is an honorific form of eat/drink used by staff addressing a customer; do not use it to describe your own action." },
    questions: [
      { id: "cafe-followup", type: "choice", korean: "여기서 드세요?", prompt: "What is the staff checking?", choices: ["Whether you are having it here", "Whether you want a refund", "What time you arrived"], answer: "Whether you are having it here", tip: "여기서 means here, at this place." },
      { id: "cafe-response", type: "text", korean: "네, 여기서 마실게요.", prompt: "Say: Yes, I’ll drink it here.", answer: "네 여기서 마실게요", accepted: ["네 여기에서 마실게요"], placeholder: "Your reply", tip: "마실게요 expresses your decision or intention to drink it." },
      { id: "cafe-order", type: "text", korean: "커피 한 잔 주세요.", prompt: "Order one cup of coffee politely.", answer: "커피 한 잔 주세요", accepted: ["커피 한 잔 좀 주세요", "커피 한 잔을 주세요"], placeholder: "Korean request", tip: "한 잔 counts one cup; 주세요 requests it politely." },
    ],
  },
  {
    id: "conversation-plans", title: "Conversation: make plans", detail: "Suggest a plan and respond to an invitation", category: "Conversation", minutes: 12,
    pathwayId: "stretch", level: "intermediate", prerequisiteLessonIds: ["plans-and-intentions"], generatedPracticeOnly: true, words: ["내일", "친구", "영화"],
    briefing: { focus: "Make an invitation, then agree on a plan.", explanation: "같이 영화를 볼까요? suggests watching a movie together. 좋아요. is a simple positive response; 내일 만나요. suggests meeting tomorrow.", useWhen: "Arrange an outing with a friend.", example: "같이 영화를 볼까요?", translation: "Shall we watch a movie together?", watchFor: "-(으)ㄹ까요 can suggest a shared action here; it has other uses depending on context." },
    questions: [
      { id: "plans-invite", type: "choice", korean: "같이 영화를 볼까요?", prompt: "What is your partner doing?", choices: ["Suggesting watching a movie together", "Describing yesterday’s movie", "Asking the movie price"], answer: "Suggesting watching a movie together", tip: "같이 means together; 볼까요 suggests watching." },
      { id: "plans-agree", type: "text", korean: "좋아요. 내일 만나요.", prompt: "Agree: Sounds good. Let’s meet tomorrow.", answer: "좋아요 내일 만나요", accepted: ["네 좋아요 내일 만나요"], placeholder: "Your Korean reply", tip: "좋아요 accepts the suggestion; 내일 means tomorrow." },
      { id: "plans-invitation", type: "text", korean: "같이 영화를 볼까요?", prompt: "Suggest watching a movie together.", answer: "같이 영화를 볼까요", accepted: ["같이 영화 볼까요"], placeholder: "Korean invitation", tip: "보다 becomes 볼까요 in this suggestion." },
    ],
  },
];
