export const vocabularyReviewStatuses = [
  "unreviewed",
  "editor_review_required",
  "editor_reviewed",
  "curated",
] as const;

export type VocabularyReviewStatus = typeof vocabularyReviewStatuses[number];

export type VocabularyWord = {
  id: string;
  korean: string;
  romanization: string;
  meaning: string;
  category: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
  source: string;
  license: string;
  reviewStatus: VocabularyReviewStatus;
};

/** Validate an entire batch before opening a database connection. */
export function validateVocabulary(rows: unknown): VocabularyWord[] {
  if (!Array.isArray(rows)) throw new Error("Vocabulary must be an array.");
  const ids = new Set<string>();
  const headwords = new Set<string>();
  return rows.map((value: unknown, index) => {
    const fail = (message: string): never => {
      throw new Error(`Vocabulary row ${index + 1}: ${message}`);
    };
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("expected an object.");
    }
    const row = value as Record<string, unknown>;
    for (const key of ["id", "korean", "meaning", "category", "partOfSpeech", "source", "license"]) {
      if (typeof row[key] !== "string" || !(row[key] as string).trim()) {
        fail(`missing ${key}.`);
      }
      if (row[key] !== (row[key] as string).trim()) fail(`${key} has surrounding whitespace.`);
    }
    for (const key of ["romanization", "example", "exampleTranslation"]) {
      if (typeof row[key] !== "string") fail(`${key} must be a string.`);
    }
    const id = row.id as string;
    const source = row.source as string;
    // Retain the existing cc-kedict IDs; all future source IDs use source:record.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source)) fail("invalid source namespace.");
    const legacyId = source === "cc-kedict" && /^cc-kedict-[0-9a-f]+(?:-[0-9a-f]+)*$/.test(id);
    if (!legacyId && !(id.startsWith(`${source}:`) && /^[a-z0-9-]+:[A-Za-z0-9._~-]+$/.test(id))) {
      fail("ID must be namespaced by its source.");
    }
    if (ids.has(id)) fail("duplicate stable ID.");
    if (headwords.has(row.korean as string)) fail("duplicate Korean headword (schema allows one row per headword).");
    if (!vocabularyReviewStatuses.includes(row.reviewStatus as VocabularyReviewStatus)) {
      fail("invalid review status.");
    }
    if ((row.license as string).toLowerCase() === "unknown") fail("license must be verified.");
    ids.add(id);
    headwords.add(row.korean as string);
    return row as VocabularyWord;
  });
}
