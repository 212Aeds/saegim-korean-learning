import { romanize } from "es-hangul";
export function transcriptRomanization(transcript: string) {
  // Normalize separators before romanization so liaison never crosses a line break.
  return romanize(transcript.normalize("NFC").trim().replace(/\s+/gu," "));
}
