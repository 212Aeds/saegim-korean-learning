import communityDictionary from "../../api/db/seeds/cc-kedict-words.json";
import communityExpansion from "../../api/db/seeds/cc-kedict-expansion-words.json";
import vocabularyBatch from "../../api/db/seeds/curated-vocabulary.json";
import originalBatch from "../../api/db/seeds/sori-original-vocabulary.json";
import { additionalVocabulary } from "./more-lessons";
import { wordBank, type KoreanWord, type WordCategory } from "./word-bank";

const seenHeadwords = new Set(
  [...wordBank, ...additionalVocabulary].map((word) => word.korean),
);

const newBatch: KoreanWord[] = vocabularyBatch.map((word) => ({
  id: word.id,
  korean: word.korean,
  romanization: word.romanization,
  meaning: word.meaning,
  category: word.category as WordCategory,
  example: word.example,
  exampleTranslation: word.exampleTranslation,
  source: word.source,
  license: word.license,
  reviewStatus: "unreviewed",
}));

const dictionaryBatch: KoreanWord[] = communityDictionary.map((word) => ({
  id: `cc-kedict-${[...word.word].map((letter) => letter.codePointAt(0)!.toString(16)).join("-")}`,
  korean: word.word,
  romanization: word.romaja,
  meaning: word.meaning,
  category: word.category as WordCategory,
  example: word.example ?? "",
  exampleTranslation: word.exampleTranslation ?? "",
  source: "cc-kedict",
  license: "CC BY-SA 3.0",
  reviewStatus: "unreviewed",
}));

const expansionBatch: KoreanWord[] = communityExpansion.map((word) => ({
  id: `cc-kedict-${[...word.word].map((letter) => letter.codePointAt(0)!.toString(16)).join("-")}`,
  korean: word.word,
  romanization: word.romaja,
  meaning: word.meaning,
  category: word.category as WordCategory,
  example: word.example ?? "",
  exampleTranslation: word.exampleTranslation ?? "",
  source: "cc-kedict",
  license: "CC BY-SA 3.0",
  reviewStatus: "unreviewed",
}));

const soriOriginalBatch: KoreanWord[] = originalBatch.map((word) => ({
  id: word.id,
  korean: word.korean,
  romanization: word.romanization,
  meaning: word.meaning,
  category: word.category as WordCategory,
  example: word.example,
  exampleTranslation: word.exampleTranslation,
  source: word.source,
  license: word.license,
  reviewStatus: word.reviewStatus as KoreanWord["reviewStatus"],
}));

export const referenceVocabulary: KoreanWord[] = [...newBatch, ...dictionaryBatch, ...expansionBatch, ...soriOriginalBatch]
  .filter((word) => {
    if (seenHeadwords.has(word.korean)) return false;
    seenHeadwords.add(word.korean);
    return true;
  });
