// Ground the tutor in lesson facts, not generated explanations of its own.
// National Institute of Korean Language: syllable composition and romanization.
// https://www.korean.go.kr/hangeul/cpron/01_elementary/03_how.htm
// https://www.korean.go.kr/front_eng/roman/roman_01.do
import type {TutorAnswer} from "./tutor.schema";

// Reuse the authored lesson for this narrow foundational intent. Generation
// repeatedly omitted the written silent ㅇ even when the facts were supplied.
export function checkedHangulAnswer(question:string):TutorAnswer|null {
  const text=question.normalize("NFC").replace(/\s+/gu," ");
  if(!/\b(?:hangul|hangeul)\b/i.test(text) || !/\b(?:syllable|block)s?\b/i.test(text))return null;
  if(!/\b(?:build|form|compose|construct|combine|composition|components?)\b|(?:only|single|one|1).{0,30}(?:letter|vowel|consonant)|(?:how many|number of).{0,35}(?:letter|component)/i.test(text))return null;
  return {
    explanation:"A written Hangul syllable block needs an initial consonant and a vowel; a final consonant is optional. In 아, silent ㅇ still counts as a written letter: ㅇ + ㅏ = 아. 가 = ㄱ + ㅏ; 간 = ㄱ + ㅏ + ㄴ.",
    hint:"A vowel-initial sound still needs written ㅇ. With ㅏ, put the consonant on the left and vowel on the right; with ㅗ, put the consonant above the vowel. Source: National Institute of Korean Language, Hangul composition guide.",
    nextExercise:"Which two written letters make 아? Then combine ㄱ and ㅗ to write 고.",
  };
}

export const lessonGrounding = `Checked lesson facts:
Hangul writing groups letters into syllable blocks. A written block contains an initial consonant letter and a vowel; a final consonant (받침) is optional. Initial ㅇ is a silent placeholder for a vowel-initial block; final ㅇ represents ng.
With a vertical vowel such as ㅏ, place the initial consonant on the LEFT and the vowel on the RIGHT: ㄱ + ㅏ = 가. With a horizontal vowel such as ㅗ, place the initial consonant ABOVE the vowel: ㄱ + ㅗ = 고. A final consonant is placed UNDER the initial-and-vowel arrangement: ㄱ + ㅏ + ㄴ = 간. Mixed vowels use a combined arrangement. The layout depends on vowel shape.
가, 사, 바, 다 have no final consonant. 한 contains ㅎ + ㅏ + ㄴ. The letter name ㄱ is 기역; its g/k cue is an English approximation that varies by context, not an exact constant English sound. Romanization is a pronunciation aid, not a replacement for Hangul.
Use these facts when relevant. State uncertainty when a question goes beyond the supplied lesson context; do not invent a rule.`;
