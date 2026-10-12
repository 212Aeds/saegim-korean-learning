import { consonantAnswers } from "./hangul-answers";
const letterNames: Record<string, string> = { "ㄱ": "기역", "ㄴ": "니은", "ㄷ": "디귿", "ㄹ": "리을", "ㅁ": "미음", "ㅂ": "비읍", "ㅅ": "시옷", "ㅇ": "이응", "ㅈ": "지읒", "ㅊ": "치읓", "ㅋ": "키읔", "ㅌ": "티읕", "ㅍ": "피읖", "ㅎ": "히읗" };
export function normalizeSpeech(text: string) {
  return text.normalize("NFC").replace(/[\s\p{P}\p{S}]/gu, "");
}
const phraseAlternatives: Record<string, string[]> = {
  "괜찮아요": ["괜찮습니다", "네괜찮아요"],
  "천천히말해주세요": ["천천히좀말해주세요", "천천히말씀해주세요"],
  "다시말해주세요": ["다시좀말해주세요", "다시말씀해주세요"],
  "내일만나요": ["내일또만나요", "내일봐요", "내일봬요"],
  "이거얼마예요": ["이것얼마예요", "이것은얼마예요", "이건얼마예요", "이거는얼마예요", "얼마예요", "이거얼마에요", "이것은얼마입니까", "이거얼마인가요"],
  "이름이뭐예요": ["이름은뭐예요", "이름이무엇이에요", "이름이뭐에요", "이름이무엇입니까"],
  "화장실이어디예요": ["화장실어디예요", "화장실은어디예요", "화장실이어디에있어요", "화장실이어디에요"],
  "저는학생이에요": ["저학생이에요", "저는학생입니다"],
  "저는미국사람이에요": ["저미국사람이에요", "저는미국사람입니다"],
  "만나서반가워요": ["만나서반갑습니다"],
  "감사합니다": ["고맙습니다", "고마워요"],
  "죄송합니다": ["죄송해요", "미안해요"],
  "물주세요": ["물좀주세요", "물을주세요"],
  "커피한잔주세요": ["커피한잔좀주세요", "커피한잔을주세요"],
  "메뉴좀주세요": ["메뉴주세요", "메뉴를주세요"],
  "오늘날씨가좋아요": ["오늘은날씨가좋아요", "오늘날씨좋아요"],
  "지금학교에가요": ["저는지금학교에가요", "지금학교로가요"],
  "집에서공부해요": ["저는집에서공부해요"],
  "친구와만나요": ["친구하고만나요", "친구랑만나요", "친구를만나요"],
  "사과를먹어요": ["사과먹어요", "저는사과를먹어요"],
  "차를마셔요": ["차마셔요", "저는차를마셔요"],
  "영화를봐요": ["영화봐요", "저는영화를봐요"],
  "음악을좋아해요": ["음악좋아해요", "저는음악을좋아해요"],
};
export function compareSpeech(expected: string, heard: string, acceptVariants = false) {
  const target = [...normalizeSpeech(expected)];
  const result = [...normalizeSpeech(heard)];
  let firstDifference = -1;
  for (let index = 0; index < Math.max(target.length, result.length); index++) {
    if (target[index] !== result[index]) { firstDifference = index; break; }
  }
  const variants = acceptVariants ? phraseAlternatives[normalizeSpeech(expected)] ?? [] : [];
  const matches = firstDifference < 0 || consonantAnswers(expected).some((answer) => normalizeSpeech(answer).toLowerCase() === normalizeSpeech(heard).toLowerCase()) || letterNames[expected] === normalizeSpeech(heard) || variants.some((variant) => normalizeSpeech(variant) === normalizeSpeech(heard));
  return { matches, targetBlock: matches ? "" : target[firstDifference] ?? "", heardBlock: matches ? "" : result[firstDifference] ?? "(no syllable heard)" };
}
export function silenceDecision(elapsedMs: number, lastSpeechMs: number, speechDetected: boolean) {
  if (!speechDetected) return elapsedMs >= 8000 ? "empty" : "continue";
  return elapsedMs - lastSpeechMs >= 1800 ? "transcribe" : "continue";
}
