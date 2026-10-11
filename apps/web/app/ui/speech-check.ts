const letterNames: Record<string, string> = { "ㄱ": "기역", "ㄴ": "니은", "ㄷ": "디귿", "ㄹ": "리을", "ㅁ": "미음", "ㅂ": "비읍", "ㅅ": "시옷", "ㅇ": "이응", "ㅈ": "지읒", "ㅊ": "치읓", "ㅋ": "키읔", "ㅌ": "티읕", "ㅍ": "피읖", "ㅎ": "히읗" };
export function normalizeSpeech(text: string) {
  return text.normalize("NFC").replace(/[\s\p{P}\p{S}]/gu, "");
}
export function compareSpeech(expected: string, heard: string) {
  const target = [...normalizeSpeech(expected)];
  const result = [...normalizeSpeech(heard)];
  let firstDifference = -1;
  for (let index = 0; index < Math.max(target.length, result.length); index++) {
    if (target[index] !== result[index]) { firstDifference = index; break; }
  }
  const matches = firstDifference < 0 || letterNames[expected] === normalizeSpeech(heard);
  return { matches, targetBlock: matches ? "" : target[firstDifference] ?? "", heardBlock: matches ? "" : result[firstDifference] ?? "(no syllable heard)" };
}
export function silenceDecision(elapsedMs: number, lastSpeechMs: number, speechDetected: boolean) {
  if (!speechDetected) return elapsedMs >= 8000 ? "empty" : "continue";
  return elapsedMs - lastSpeechMs >= 1800 ? "transcribe" : "continue";
}
