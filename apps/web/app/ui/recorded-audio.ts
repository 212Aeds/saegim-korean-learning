import manifest from "../audio-manifest.json";
import {naturalSpeechText} from "./hangul-answers";
export function recordedAudioUrl(text:string,voice:"chris"|"jessica") {
  const clean=naturalSpeechText(text).normalize("NFC").trim().replace(/\s+/gu," ");
  return (manifest as Record<string,string>)[`${voice}|${clean}`];
}
export const recordedAudioEnabled=process.env.NEXT_PUBLIC_PRERECORDED_AUDIO === "true";
