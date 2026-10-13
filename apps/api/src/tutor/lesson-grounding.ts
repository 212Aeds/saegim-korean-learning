// Ground the tutor in lesson facts, not generated explanations of its own.
// National Institute of Korean Language: syllable composition and romanization.
// https://www.korean.go.kr/hangeul/cpron/01_elementary/03_how.htm
// https://www.korean.go.kr/front_eng/roman/roman_01.do
export const lessonGrounding = `Checked lesson facts:
Hangul writing groups letters into syllable blocks. A written block contains an initial consonant letter and a vowel; a final consonant (받침) is optional. Initial ㅇ is a silent placeholder for a vowel-initial block; final ㅇ represents ng.
With a vertical vowel such as ㅏ, place the initial consonant on the LEFT and the vowel on the RIGHT: ㄱ + ㅏ = 가. With a horizontal vowel such as ㅗ, place the initial consonant ABOVE the vowel: ㄱ + ㅗ = 고. A final consonant is placed UNDER the initial-and-vowel arrangement: ㄱ + ㅏ + ㄴ = 간. Mixed vowels use a combined arrangement. The layout depends on vowel shape.
가, 사, 바, 다 have no final consonant. 한 contains ㅎ + ㅏ + ㄴ. The letter name ㄱ is 기역; its g/k cue is an English approximation that varies by context, not an exact constant English sound. Romanization is a pronunciation aid, not a replacement for Hangul.
Use these facts when relevant. State uncertainty when a question goes beyond the supplied lesson context; do not invent a rule.`;
