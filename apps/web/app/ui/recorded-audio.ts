import manifest from "../audio-manifest.json";
import {naturalSpeechText} from "./hangul-answers";
export function recordedAudioUrl(text:string,voice:"chris"|"jessica") {
  const clean=naturalSpeechText(text).normalize("NFC").trim().replace(/\s+/gu," ");
  const code=clean.charCodeAt(0);
  if(clean.length===1&&code>=0xac00&&code<=0xd7a3&&(code-0xac00)%28===0)return `/audio/blocks/${voice}-${code}.wav`;
  return (manifest as Record<string,string>)[`${voice}|${clean}`];
}
export const recordedAudioEnabled=process.env.NEXT_PUBLIC_PRERECORDED_AUDIO === "true";

export function flashcardSpeechText(text:string) {
  if(!/^[가-힣ㄱ-ㅎㅏ-ㅣ\s,.!?]+$/u.test(text.trim()))return undefined;
  return naturalSpeechText(text).normalize("NFC").trim().replace(/\s+/gu," ");
}
