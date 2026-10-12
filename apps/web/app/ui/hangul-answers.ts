// Letter names: National Institute of Korean Language, FAQ 5573.
// Roman sound cues are approximations, not pronunciation scores.
const consonants: Record<string, [string, string, string[]]> = {
  "ㄱ": ["giyeok", "기역", ["g", "k", "g/k"]], "ㄲ": ["ssanggiyeok", "쌍기역", ["kk"]],
  "ㄴ": ["nieun", "니은", ["n"]], "ㄷ": ["digeut", "디귿", ["d", "t", "d/t"]],
  "ㄸ": ["ssangdigeut", "쌍디귿", ["tt"]], "ㄹ": ["rieul", "리을", ["r", "l", "r/l"]],
  "ㅁ": ["mieum", "미음", ["m"]], "ㅂ": ["bieup", "비읍", ["b", "p", "b/p"]],
  "ㅃ": ["ssangbieup", "쌍비읍", ["pp"]], "ㅅ": ["siot", "시옷", ["s"]],
  "ㅆ": ["ssangsiot", "쌍시옷", ["ss"]], "ㅇ": ["ieung", "이응", ["ng", "silent"]],
  "ㅈ": ["jieut", "지읒", ["j"]], "ㅉ": ["ssangjieut", "쌍지읒", ["jj"]],
  "ㅊ": ["chieut", "치읓", ["ch"]], "ㅋ": ["kieuk", "키읔", ["k"]],
  "ㅌ": ["tieut", "티읕", ["t"]], "ㅍ": ["pieup", "피읖", ["p"]], "ㅎ": ["hieut", "히읗", ["h"]],
};
export function consonantAnswers(letter: string) {
  const entry = consonants[letter];
  return entry ? [entry[0], entry[1], ...entry[2]] : [];
}
export function consonantName(letter: string) { return consonants[letter]?.[1]; }
export function consonantNameQuestion(letter: string, answer: string) {
  return consonants[letter]?.[0] === answer.trim().toLowerCase();
}
export function naturalSpeechText(text: string) { return consonantName(text.trim()) ?? text; }
