import { shuffle, type Lesson, type LessonQuestion, type MultipleChoiceQuestion, type TextQuestion } from "../curriculum";
import { additionalVocabulary, hangulLetters, hangulSyllableExamples } from "../more-lessons";
import { wordBank, type KoreanWord } from "../word-bank";
const allWords: KoreanWord[] = [...wordBank, ...additionalVocabulary, ...hangulLetters];
function makeChoice(
  id: string,
  korean: string,
  prompt: string,
  answer: string,
  distractors: string[],
  tip: string,
): MultipleChoiceQuestion {
  return {
    id,
    type: "choice",
    korean,
    prompt,
    choices: Array.from(
      new Set([answer, ...distractors.filter((item) => item !== answer).slice(0, 3)]),
    ),
    answer,
    tip,
  };
}

function makeText(
  id: string,
  korean: string,
  prompt: string,
  answer: string,
  tip: string,
  placeholder: string,
  accepted: string[] = [],
): TextQuestion {
  return { id, type: "text", korean, prompt, answer, accepted, tip, placeholder };
}

export function generatedQuestions(lesson: Lesson): LessonQuestion[] {
  const words = lesson.words
    .map((korean) => lesson.category === "Hangul" && hangulSyllableExamples.some((sample) => sample.korean === korean)
      ? undefined
      : allWords.find((word) => word.korean === korean))
    .filter((word): word is KoreanWord => Boolean(word));
  const syllableQuestions = lesson.category === "Hangul"
    ? lesson.words.flatMap((korean) => {
        const sample = hangulSyllableExamples.find((item) => item.korean === korean);
        if (!sample) return [];
        const note = `${sample.letters.join(" + ")} builds ${sample.korean}, read as ${sample.romanization}. This is a reading sample, not a word definition.`;
        const alternatives = hangulSyllableExamples.filter((item) => item.id !== sample.id);
        return [
          makeText(`syllable-recall-${lesson.id}-${sample.id}`, sample.korean, "Recall this syllable’s romanized sound.", sample.romanization, note, "Romanized syllable"),
          makeChoice(`syllable-choice-${lesson.id}-${sample.id}`, sample.letters.join(" + "), "Which block combines these letters?", sample.korean, shuffle(alternatives.map((item) => item.korean)).slice(0, 3), note),
          makeText(`syllable-build-${lesson.id}-${sample.id}`, sample.letters.join(" + "), "Write the Hangul block formed by these letters.", sample.korean, note, "One Hangul block"),
        ];
      })
    : [];
  const wordQuestions = words.flatMap((word, index) => {
    const distractors = words.filter((item) => item.korean !== word.korean);
    const syllables = Array.from(word.korean).filter((letter) => /[가-힣]/.test(letter));
    const sampleSyllable = word.category === "Hangul" ? word.example : syllables[0] ?? word.korean;
    const note = word.category === "Hangul"
      ? `${word.korean} is usually ${word.meaning}. A sample block is ${word.example}.`
      : `${word.korean} (${word.romanization}) means ${word.meaning}. Notice its first block: ${sampleSyllable}.`;

    if (word.category === "Hangul") {
      const otherLetters = hangulLetters
        .filter((letter) => letter.korean !== word.korean)
        .map((letter) => letter.korean);
      const otherSounds = hangulLetters
        .filter((letter) => letter.korean !== word.korean)
        .map((letter) => letter.meaning);
      const otherSamples = hangulLetters
        .filter((letter) => !hangulSyllableExamples.find((sample) => sample.korean === letter.example)?.letters.includes(word.korean))
        .map((letter) => letter.example);
      return [
        makeChoice(`letter-sound-${lesson.id}-${index}`, word.korean, "Which sound cue matches this letter?", word.meaning, shuffle(otherSounds).slice(0, 3), note),
        makeText(`letter-write-${lesson.id}-${index}`, word.korean, "Type the letter’s romanized name or sound.", word.romanization, note, "Romanized sound"),
        makeText(`letter-build-${lesson.id}-${index}`, word.korean, `Write the Hangul letter for “${word.meaning}”.`, word.korean, note, "Hangul letter"),
        makeChoice(`letter-find-${lesson.id}-${index}`, word.korean, `Which letter matches “${word.meaning}”?`, word.korean, shuffle(otherLetters).slice(0, 3), note),
        makeChoice(`letter-syllable-${lesson.id}-${index}`, word.korean, "Which example block includes this letter?", word.example, shuffle(otherSamples).slice(0, 3), note),
      ];
    }

    const distractorMeanings = shuffle(distractors.map((item) => item.meaning));
    const meaningAlternatives = word.meaning
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(1, 3);
    const answerNote = word.example
      ? `${note} In context: ${word.example}`
      : note;
    return [
      makeChoice(`word-choice-${lesson.id}-${index}`, word.korean, "Choose the closest meaning.", word.meaning, distractorMeanings, answerNote),
      makeText(`word-write-${lesson.id}-${index}`, word.korean, "Write the English meaning from memory.", word.meaning, answerNote, "Meaning in English", meaningAlternatives),
      makeText(`word-spell-${lesson.id}-${index}`, word.korean, "Write the Korean pronunciation in roman letters.", word.romanization, answerNote, "Romanized pronunciation"),
      makeText(`word-hangul-${lesson.id}-${index}`, word.korean, `Write “${word.meaning}” in Korean.`, word.korean, answerNote, "Your answer in Hangul"),
      makeChoice(`word-syllable-${lesson.id}-${index}`, word.korean, "Guess the first Hangul block.", sampleSyllable, shuffle(distractors.flatMap((item) => Array.from(item.korean).filter((letter) => /[가-힣]/.test(letter)))), answerNote),
    ];
  });
  return [...syllableQuestions, ...wordQuestions];
}

export function lessonConcept(question: LessonQuestion, lesson: Lesson) {
  const korean = question.korean.normalize("NFC").replace(/\s+/gu, "");
  if (korean.includes("+")) {
    const answer = lesson.words.find(word => word === question.answer);
    if (answer) return answer;
  }
  return korean;
}
// Keep all exercises, using stable tie ordering while spacing repeated concepts.
export function spaceLessonQuestions(items: LessonQuestion[], lesson: Lesson) {
  const remaining = [...items], result: LessonQuestion[] = [];
  while (remaining.length) {
    const counts = new Map<string,number>();
    for (const question of remaining) {const key=lessonConcept(question,lesson);counts.set(key,(counts.get(key)??0)+1);}
    const recent = result.slice(-2).map(question => lessonConcept(question, lesson));
    const ranked = [...counts.keys()].sort((a,b)=>(counts.get(b)??0)-(counts.get(a)??0));
    const allowed = ranked.filter(key=>!(recent.length === 2 && recent.every(previous=>previous===key)));
    const choices = allowed.length ? allowed : ranked;
    // For balanced groups prefer another item; for a dominant group allow a pair
    // now rather than leaving a long unbroken tail at the end of the lesson.
    const first=choices[0];
    const other=choices.find(key=>key!==recent.at(-1));
    const selected=other && (counts.get(other)??0)===(counts.get(first)??0) ? other : first;
    const index=remaining.findIndex(question=>lessonConcept(question,lesson)===selected);
    result.push(remaining.splice(index < 0 ? 0 : index, 1)[0]);
  }
  return result;
}
export function lessonIntroduction(lesson: Lesson) {
  return lesson.briefing ?? {
    focus: lesson.title,
    explanation: lesson.detail,
    useWhen: "Study the examples first, then practice recalling them in different ways.",
    example: lesson.words[0] ?? lesson.questions[0]?.korean ?? "",
    translation: lesson.questions[0]?.tip ?? "Read each example carefully before you begin.",
  };
}
export function lessonTopicIntroduction(question: LessonQuestion | undefined, lesson: Lesson) {
  if (lesson.category === "Hangul" && question && /build|combine|formed/iu.test(question.prompt)) return {
    id:"build-syllables",title:"Now build a syllable block",
    explanation:"A Hangul syllable is written as one block. Combine the starting consonant and vowel shown in the question, rather than writing separate letters.",
    example:"ㄱ + ㅏ → 가",translation:"A consonant and a vowel combine into one syllable block.",
  };
  return null;
}

export function prepareQuestions(lesson: Lesson) {
  const supplemental = lesson.authoredOnly ? [] : generatedQuestions(lesson);
  const all = [...lesson.questions, ...supplemental];
  const quizEligible = all.filter(
    (question) => !lesson.practiceOnlyQuestionIds?.includes(question.id),
  );
  const quizByKorean = new Map<string, LessonQuestion[]>();
  for (const question of quizEligible) {
    const questions = quizByKorean.get(question.korean) ?? [];
    questions.push(question);
    quizByKorean.set(question.korean, questions);
  }
  const onePerItem = [...quizByKorean.values()].map(
    (questions) => shuffle(questions)[0],
  );
  const prepare = (items: LessonQuestion[]) =>
    items.map((question) =>
      question.type === "choice"
        ? { ...question, choices: shuffle(question.choices) }
        : question,
    );
  return {
    practice: prepare(spaceLessonQuestions(lesson.authoredOnly ? lesson.questions : lesson.generatedPracticeOnly
      ? [...lesson.questions, ...shuffle(supplemental)]
      : shuffle(all), lesson)),
    quiz: prepare(shuffle(onePerItem)),
  };
}

