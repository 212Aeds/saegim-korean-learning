import { config } from "dotenv";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { validateVocabulary, type VocabularyWord } from "./validate-vocabulary";

config({ path: resolve(__dirname, "../../../.env.local") });
config({ path: resolve(__dirname, "../../../.env") });

type DictionaryWord = {
  word: string;
  romaja: string;
  meaning: string;
  category: string;
  pos: string;
  example: string;
  exampleTranslation: string;
  source: string;
};

type SourceManifest = {
  sources: Array<{
    source: string;
    license: string;
    approval: string;
    defaultReviewStatus: string;
    batches: Array<{ file: string; rows: number; sha256: string }>;
  }>;
};

async function loadVocabulary(): Promise<VocabularyWord[]> {
  const seedDirectory = resolve(__dirname, "../db/seeds");
  const manifest = JSON.parse(await readFile(resolve(seedDirectory, "source-manifest.json"), "utf8")) as SourceManifest;
  const allowedSources = new Set(["cc-kedict", "sori-original"]);
  const combined: unknown[] = [];
  for (const source of manifest.sources) {
    if (!allowedSources.has(source.source) ||
        (source.source === "cc-kedict" && !["existing-checked-in-batches-only", "user-requested-additional-cc-kedict-batch"].includes(source.approval)) ||
        (source.source === "sori-original" && source.approval !== "user-requested-original-content")) {
      throw new Error("Vocabulary source approval does not match this import pipeline.");
    }
    for (const batch of source.batches) {
      const content = await readFile(resolve(seedDirectory, batch.file), "utf8");
      if (createHash("sha256").update(content).digest("hex") !== batch.sha256) {
        throw new Error(`Vocabulary batch ${batch.file} changed; audit and approve its manifest before importing.`);
      }
      const rows: unknown = JSON.parse(content);
      if (!Array.isArray(rows) || rows.length !== batch.rows) {
        throw new Error(`Vocabulary batch ${batch.file} does not match its audited row count.`);
      }
      if (source.source === "cc-kedict" && batch.file !== "curated-vocabulary.json") {
        combined.push(...(rows as DictionaryWord[]).map((word) => ({
          id: `cc-kedict-${[...word.word].map((letter) => letter.codePointAt(0)!.toString(16)).join("-")}`,
          korean: word.word,
          romanization: word.romaja,
          meaning: word.meaning,
          category: word.category,
          partOfSpeech: word.pos,
          example: word.example ?? "",
          exampleTranslation: word.exampleTranslation ?? "",
          source: word.source,
          license: source.license,
          reviewStatus: source.defaultReviewStatus,
        })));
      } else {
        combined.push(...rows);
      }
    }
    const sourceRows = combined.filter((value) => value && typeof value === "object" && "source" in value && value.source === source.source) as Record<string, unknown>[];
    for (const word of sourceRows) {
      if (word.source !== source.source || word.license !== source.license || word.reviewStatus !== source.defaultReviewStatus) {
        throw new Error("Vocabulary must match the approved source, license and default reference review status.");
      }
    }
  }
  return validateVocabulary(combined);
}

async function seedWords() {
  // Reject malformed or unaudited material before making any connection.
  const words = await loadVocabulary();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5_000 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const payload = JSON.stringify(words.map((word) => ({
      id: word.id, korean: word.korean, romanization: word.romanization,
      meaning: word.meaning, category: word.category, part_of_speech: word.partOfSpeech,
      example: word.example || null, example_translation: word.exampleTranslation || null,
      source: word.source, license: word.license, review_status: word.reviewStatus,
    })));
    const conflicts = await client.query<{ word: string; stable_id: string | null; korean: string; id: string }>(
      `WITH incoming AS (
         SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text, korean text)
       )
       SELECT current.word, current.stable_id, incoming.korean, incoming.id
       FROM korean_words AS current
       JOIN incoming ON current.word = incoming.korean OR current.stable_id = incoming.id
       WHERE current.word <> incoming.korean
          OR (current.stable_id IS NOT NULL AND current.stable_id <> incoming.id)
       FOR UPDATE OF current`,
      [payload],
    );
    if (conflicts.rows.length) throw new Error("Vocabulary stable ID conflict; existing identities must be preserved.");

    // Attach IDs to pre-migration rows without changing their content/status.
    await client.query(
      `UPDATE korean_words AS current SET stable_id = incoming.id
       FROM jsonb_to_recordset($1::jsonb) AS incoming(id text, korean text)
       WHERE current.word = incoming.korean AND current.stable_id IS NULL`,
      [payload],
    );
    await client.query(
      `INSERT INTO korean_words
        (stable_id, word, romanization, meaning, category, part_of_speech,
         example, example_translation, source, source_license, review_status)
       SELECT id, korean, romanization, meaning, category, part_of_speech,
              example, example_translation, source, license, review_status
       FROM jsonb_to_recordset($1::jsonb) AS incoming(
         id text, korean text, romanization text, meaning text, category text,
         part_of_speech text, example text, example_translation text,
         source text, license text, review_status text
       )
       ON CONFLICT (stable_id) WHERE stable_id IS NOT NULL DO UPDATE SET
         romanization = EXCLUDED.romanization,
         meaning = EXCLUDED.meaning,
         category = EXCLUDED.category,
         part_of_speech = EXCLUDED.part_of_speech,
         example = EXCLUDED.example,
         example_translation = EXCLUDED.example_translation,
         source = EXCLUDED.source,
         source_license = EXCLUDED.source_license,
         review_status = EXCLUDED.review_status
       WHERE korean_words.word = EXCLUDED.word
         AND korean_words.review_status = 'unreviewed'`,
      [payload],
    );
    await client.query("COMMIT");
    process.stdout.write(`Seeded ${words.length} audited reference entries without promoting review status.\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void seedWords().catch((error: unknown) => {
  // Database errors may include connection details; keep CLI failures private.
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "validation-or-connection";
  process.stderr.write(`Vocabulary seed failed (${code}). Check batch validation and migration 004 in a controlled environment.\n`);
  process.exitCode = 1;
});
