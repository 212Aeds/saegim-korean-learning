// Ground the tutor in lesson facts, not generated explanations of its own.
// National Institute of Korean Language: syllable composition and romanization.
// https://www.korean.go.kr/hangeul/cpron/01_elementary/03_how.htm
// https://www.korean.go.kr/front_eng/roman/roman_01.do
import type {TutorAnswer} from "./tutor.schema";

// NIKL 좋아하다 examples include noun-modifying 좋아하는 and sentence forms.
// https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=27929&nation=eng
export function checkedLikeFormAnswer(question:string):TutorAnswer|null {
  const text=question.normalize("NFC");
  if(!text.includes("좋아하는")||!text.includes("좋아해요")||!/formal|differen|polite|meaning|차이|존댓말|공손/i.test(text))return null;
  return {
    explanation:"좋아해요 can end a polite sentence: 책을 좋아해요 means I like books. 좋아하는 modifies a following noun: 좋아하는 책 means a book someone likes. These forms have different grammatical roles; 좋아하는 is not a more polite replacement for 좋아해요.",
    hint:"Use 좋아하는 before a noun and 좋아해요 to finish a polite statement or question. The person who likes something is supplied by context. Source: NIKL Korean-English dictionary, 좋아하다 examples.",
    nextExercise:"Compare 책을 좋아해요 (I like books) with 제가 좋아하는 책 (a book I like). Notice which form finishes the statement and which describes 책.",
  };
}

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


// Narrow authored answer for the common entry question. Broader or multi-part
// questions still go to the tutor, and conversation turns never use this route.
// NIKL Korean-English Learners' Dictionary: 안녕하다, polite greeting examples.
// https://krdict.korean.go.kr/eng/dicMarinerSearch/search?mainSearchWord=안녕하다
export function checkedGreetingAnswer(question:string):TutorAnswer|null {
  const text=question.normalize("NFC").toLowerCase().replace(/[?!.]/gu,"").replace(/\s+/gu," ").trim();
  if(!["how do i say hello politely in korean","how do i say hello in korean","how do you say hello in korean","how do you say hello politely in korean"].includes(text))return null;
  return {
    explanation:"안녕하세요 is a standard polite greeting meaning hello. Use it when meeting someone or beginning a polite exchange. 안녕 is an informal greeting for people you are on close, casual terms with; it can also mean bye.",
    hint:"Start with 안녕하세요 when you want a polite greeting. Romanization: annyeonghaseyo. Source: National Institute of Korean Language, Korean-English Learners’ Dictionary, 안녕하다 greeting examples.",
    nextExercise:"Say 안녕하세요, then try a short introduction: 저는 학생이에요. (I am a student.)",
  };
}
