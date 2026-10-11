import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { SessionAuthGuard } from "./session-auth.guard";
import { vocabularyReviewStatuses, type VocabularyReviewStatus } from "./validate-vocabulary";

@Controller("health")
export class LearningController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async health() {
    try {
      await this.database.query("SELECT 1");
      return { status: "ok", database: "connected" };
    } catch {
      throw new HttpException(
        { status: "unavailable", database: "disconnected" },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

type WordRow = {
  stable_id: string | null;
  word: string;
  romanization: string;
  meaning: string;
  category: string;
  example: string | null;
  example_translation: string | null;
  source: string;
  source_license: string;
  review_status: VocabularyReviewStatus;
};

@Controller("words")
@UseGuards(SessionAuthGuard)
export class WordsController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async list(
    @Query("q") query = "",
    @Query("category") category = "",
    @Query("offset") rawOffset = "0",
    @Query("limit") rawLimit = "50",
    @Query("reviewStatus") reviewStatus = "",
    @Query("reviewedOnly") reviewedOnly = "false",
  ) {
    if (reviewStatus && !vocabularyReviewStatuses.includes(reviewStatus as VocabularyReviewStatus)) {
      throw new BadRequestException("Invalid vocabulary review status.");
    }
    if (reviewedOnly !== "true" && reviewedOnly !== "false") {
      throw new BadRequestException("reviewedOnly must be true or false.");
    }
    const offset = Math.max(0, Math.min(100_000, Number.parseInt(rawOffset, 10) || 0));
    const limit = Math.max(1, Math.min(100, Number.parseInt(rawLimit, 10) || 50));
    const search = query.trim().slice(0, 100);
    const selectedCategory = category.trim().slice(0, 24);
    const where = `($1 = '' OR word ILIKE $2 OR romanization ILIKE $2 OR meaning ILIKE $2)
                   AND ($3 = '' OR category = $3)
                   AND ($4 = '' OR review_status = $4)
                   AND (NOT $5::boolean OR review_status = 'editor_reviewed')`;
    // Curriculum/exercise/review consumers must request reviewedOnly=true.
    // The legacy 'curated' label means selection, not an editorial review.
    const filters = [search, `%${search}%`, selectedCategory, reviewStatus, reviewedOnly === "true"];
    const result = await this.database.query<WordRow>(
      `SELECT stable_id, word, romanization, meaning, category, example, example_translation,
              source, source_license, review_status
       FROM korean_words WHERE ${where}
       ORDER BY word LIMIT $6 OFFSET $7`,
      [...filters, limit, offset],
    );
    const count = await this.database.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM korean_words WHERE ${where}`,
      filters,
    );
    return {
      words: result.rows.map((row) => ({
        id: row.stable_id ?? `dictionary-${row.word}`,
        korean: row.word,
        romanization: row.romanization,
        meaning: row.meaning,
        category: row.category,
        example: row.example,
        exampleTranslation: row.example_translation,
        source: row.source,
        license: row.source_license,
        reviewStatus: row.review_status,
      })),
      total: Number(count.rows[0].count),
      offset,
      limit,
    };
  }
}
