export type PublicGuide = {
  slug:string; title:string; description:string; eyebrow:string; minutes:number;
  sections:{title:string;body:string}[];
  samples:{korean:string;meaning:string;romanization?:string;readingSample?:boolean}[];
  check:{prompt:string;choices:string[];answer:string;explanation:string};
  source:{title:string;url:string};
};
export const publicGuides:PublicGuide[]=[
 {slug:"hangul-basics",title:"Start reading Hangul, one block at a time",description:"Meet a consonant, a vowel, and the syllable they build. A small Korean alphabet guide with recorded audio and practice.",eyebrow:"YOUR FIRST LETTERS",minutes:4,
 sections:[{title:"Letters become a block",body:"Hangul letters are arranged into syllable blocks. Start with a small pair: ㄱ and ㅏ combine as 가. Learn the shapes separately, then notice how they fit together."},{title:"A letter name is not a whole word",body:"ㄱ is called giyeok. English g and k are rough sound cues, not an exact pronunciation rule for every position. Listen to the recorded letter name, then compare it with the syllable 가."},{title:"Read before you guess a meaning",body:"Here 가 is a reading sample. Your task is to connect the letters and their sound; a syllable by itself is not being given a vocabulary definition. In the lessons, more letters come before longer words."}],
 samples:[{korean:"ㄱ",meaning:"Letter name: giyeok",romanization:"giyeok"},{korean:"ㅏ",meaning:"Vowel: a",romanization:"a"},{korean:"가",meaning:"Reading sample: ㄱ + ㅏ",readingSample:true}],
 check:{prompt:"Which block combines ㄱ and ㅏ?",choices:["가","나","마"],answer:"가",explanation:"ㄱ + ㅏ builds 가. The consonant and vowel share one syllable block."},
 source:{title:"NIKL: the principles of Hangul",url:"https://www.korean.go.kr/eng_hangeul/principle/001.html"}},
 {slug:"korean-greetings",title:"Three polite Korean phrases to begin with",description:"Practice hello, thank you, and an apology in Korean with Chris or Jessica audio and linked dictionary references.",eyebrow:"YOUR FIRST EXCHANGE",minutes:4,
 sections:[{title:"Start with a greeting",body:"안녕하세요 is a polite greeting. Listen to the whole phrase before trying it yourself. You do not need to translate each syllable separately to begin practicing this expression."},{title:"Add thanks and an apology",body:"감사합니다 expresses thanks, and 죄송합니다 expresses an apology. Keep their situations separate: thank someone for help; apologize when you have caused a problem. These are useful polite starting forms, not every possible way to express those ideas."},{title:"Make a tiny exchange",body:"Choose one situation before you speak: meeting someone, receiving help, or apologizing. Recall the matching phrase before you press Listen. Then compare your recall with the example. This is a practice suggestion, not a pronunciation assessment."}],
 samples:[{korean:"안녕하세요",meaning:"Hello — a polite greeting"},{korean:"감사합니다",meaning:"Thank you"},{korean:"죄송합니다",meaning:"I’m sorry — a polite apology"}],
 check:{prompt:"Someone helps you. Which phrase expresses thanks?",choices:["감사합니다","죄송합니다","안녕하세요"],answer:"감사합니다",explanation:"감사합니다 expresses thanks. 죄송합니다 is an apology; 안녕하세요 is a greeting."},
 source:{title:"NIKL Korean-English Learners’ Dictionary",url:"https://krdict.korean.go.kr/eng/mainAction?flag=PC"}},
 {slug:"first-korean-words",title:"Read your first four Korean words",description:"Read 가방, 나무, 바다, and 우유 with recorded Korean audio, meanings, references, and a quick recall question.",eyebrow:"FROM BLOCKS TO WORDS",minutes:5,
 sections:[{title:"Connect reading with a meaning",body:"Once familiar letters are comfortable, try these short words. Read one block at a time, then connect the whole word with its meaning. Return to the Hangul guide whenever a shape is unfamiliar."},{title:"Notice the blocks",body:"가방 has the blocks 가 and 방; 나무 has 나 and 무; 바다 has 바 and 다; 우유 has 우 and 유. In these examples, the initial ㅇ in 우 and 유 does not add a consonant sound. The final ㅇ in 방 has an ng sound."},{title:"Recall in both directions",body:"First look at the Korean and recall the meaning. Later, look at the meaning and try writing the Korean before checking it. In Saegim, lessons lead into scheduled review; this public guide is a small preview and does not mark a lesson complete."}],
 samples:[{korean:"가방",meaning:"bag"},{korean:"나무",meaning:"tree"},{korean:"바다",meaning:"sea"},{korean:"우유",meaning:"milk"}],
 check:{prompt:"Which word means milk?",choices:["우유","나무","가방"],answer:"우유",explanation:"우유 means milk. 나무 means tree; 가방 means bag."},
 source:{title:"NIKL Korean-English Learners’ Dictionary",url:"https://krdict.korean.go.kr/eng/mainAction?flag=PC"}},
];
