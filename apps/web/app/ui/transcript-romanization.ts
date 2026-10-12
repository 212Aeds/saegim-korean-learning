import { romanize } from "es-hangul";
export function transcriptRomanization(transcript: string) {
  return romanize(transcript.normalize("NFC").trim());
}
