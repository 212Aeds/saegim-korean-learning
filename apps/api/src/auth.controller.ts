import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Put,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  createHmac,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { DatabaseService } from "./database.service";
import { progressSchema, type ProgressPayload } from "./progress.schema";

const scrypt = promisify(scryptCallback);
const sessionCookie = "sori_session";
const sessionDurationSeconds = 60 * 60 * 24 * 30;
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(120)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});
const learningProfileSchema = z.object({ level: z.enum(["new", "hangul", "basic", "intermediate", "advanced"]), reasons: z.array(z.enum(["family", "travel", "culture", "work-study", "friends", "food", "living", "exams"])).min(1).max(8).transform((reasons) => [...new Set(reasons)]), avatar: z.enum(["sprout", "cat", "star", "moon"]).default("sprout"), weeklyGoal: z.union([z.literal(3), z.literal(5), z.literal(7)]).default(5), dailyMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]).optional(), onboardingCompleted: z.boolean().optional() });
const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(1).max(40),
  learningProfile: learningProfileSchema.default({ level: "new", reasons: ["culture"], avatar: "sprout", weeklyGoal: 5 }),
});
const accountNameSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(40),
  learningProfile: learningProfileSchema.optional(),
});

type Account = { id: string; email: string; displayName: string; learningProfile: z.infer<typeof learningProfileSchema> };
type AccountRow = {
  id: string;
  email: string;
  display_name: string;
  learning_profile: z.infer<typeof learningProfileSchema>;
  password_hash?: string;
};
type AuthenticatedRequest = Request & { soriAccount?: Account };

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cookieToken(request: Request) {
  const rawCookie = request.headers.cookie;
  if (!rawCookie) return null;
  const cookie = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return cookie?.slice(sessionCookie.length + 1) || null;
}

function setSessionCookie(response: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationSeconds}${secure}`,
  );
}

function clearSessionCookie(response: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}

async function passwordDigest(password: string, salt: Buffer) {
  return (await scrypt(password, salt, 64)) as Buffer;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await passwordDigest(password, salt);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await passwordDigest(password, salt);
  return timingSafeEqual(actual, expected);
}

@Controller()
export class AuthController {
  constructor(private readonly database: DatabaseService) {}

  @Post("auth/register")
  async register(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Account> {
    const input = registerSchema.safeParse(body);
    if (!input.success) {
      throw new HttpException(
        {
          message:
            "Add a valid email, name, and password of at least 12 characters.",
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.guardRateLimit("register", request.ip ?? "unknown");

    let account: Account;
    try {
      const passwordHash = await hashPassword(input.data.password);
      const created = await this.database.query<AccountRow>(
        `INSERT INTO learner_accounts (email, display_name, password_hash, learning_profile)
         VALUES ($1, $2, $3, $4::jsonb)
         RETURNING id, email, display_name, learning_profile`,
        [input.data.email, input.data.displayName, passwordHash, JSON.stringify(input.data.learningProfile)],
      );
      account = this.publicAccount(created.rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new HttpException(
          {
            message:
              "An account with this email already exists. Try signing in.",
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        {
          message:
            "Accounts are unavailable right now. Your local progress is safe.",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.createSession(account.id, request, response);
    return account;
  }

  @Post("auth/login")
  @Header("Cache-Control", "private, no-store")
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Account & { learningProgress: unknown }> {
    const input = loginSchema.safeParse(body);
    if (!input.success) {
      throw new HttpException(
        { message: "Enter a valid email and password." },
        HttpStatus.BAD_REQUEST,
      );
    }
    const address = request.ip ?? "unknown";
    await this.guardRateLimit("login", `${input.data.email}:${address}`);

    let account: Account;
    try {
      const result = await this.database.query<AccountRow>(
        `SELECT id, email, display_name, password_hash, learning_profile
         FROM learner_accounts WHERE email = $1`,
        [input.data.email],
      );
      const row = result.rows[0];
      const valid = row?.password_hash
        ? await verifyPassword(input.data.password, row.password_hash)
        : await verifyPassword(
            input.data.password,
            "scrypt$00000000000000000000000000000000$" + "0".repeat(128),
          );
      if (!row || !valid) {
        await this.recordRateLimit("login", `${input.data.email}:${address}`);
        throw new HttpException(
          { message: "Email or password doesn’t match." },
          HttpStatus.UNAUTHORIZED,
        );
      }
      account = this.publicAccount(row);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          message:
            "Sign-in is unavailable right now. Your local progress is safe.",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.database.query(
      "DELETE FROM auth_rate_limits WHERE key_hash = $1",
      [this.rateKey("login", `${input.data.email}:${address}`)],
    );
    await this.createSession(account.id, request, response);
    return { ...account, learningProgress: await this.readProgress(account.id) };
  }

  @Get("auth/me")
  async currentAccount(@Req() request: Request): Promise<Account | null> {
    return (await this.getAccount(request))?.account ?? null;
  }

  @Patch("account/me")
  async updateMyAccountName(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<Account> {
    const account = await this.requireAccount(request);
    const input = accountNameSchema.safeParse(body);
    if (!input.success) {
      throw new HttpException(
        { message: "Choose a name between 1 and 40 characters." },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const updated = await this.database.query<AccountRow>(
        `UPDATE learner_accounts SET display_name = $2, learning_profile = COALESCE($3::jsonb, learning_profile)
         WHERE id = $1 RETURNING id, email, display_name, learning_profile`,
        [account.id, input.data.displayName, input.data.learningProfile ? JSON.stringify(input.data.learningProfile) : null],
      );
      if (!updated.rowCount) {
        throw new HttpException({ message: "Your account could not be found." }, HttpStatus.NOT_FOUND);
      }
      return this.publicAccount(updated.rows[0]);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: "Your account name could not be saved. Please try again." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post("auth/logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = cookieToken(request);
    if (token) {
      await this.database.query(
        "DELETE FROM learner_sessions WHERE token_hash = $1",
        [hash(token)],
      );
    }
    clearSessionCookie(response);
    return { signedOut: true };
  }

  @Get("progress/me")
  async getMyProgress(@Req() request: AuthenticatedRequest) {
    const account = await this.requireAccount(request);
    return this.readProgress(account.id);
  }

  private async readProgress(accountId: string) {
    try {
      const result = await this.database.query(
        `SELECT completed_lessons, completed_lesson_ids, words_learned,
                daily_goal_minutes, speaking_card_ids, speaking_card_id,
                learning_preferences, daily_practice,
                reviews_done, quiz_attempts, quiz_correct, streak,
                last_activity, activity_dates, review_items
         FROM learner_progress WHERE account_id = $1`,
        [accountId],
      );
      if (!result.rowCount) return null;
      const row = result.rows[0];
      return {
        completed: row.completed_lessons,
        dailyGoalMinutes: row.daily_goal_minutes,
        speakingCardIds: row.speaking_card_ids,
        speakingCardId: row.speaking_card_id,
        learningPreferences: row.learning_preferences,
        dailyPractice: row.daily_practice,
        completedLessonIds: row.completed_lesson_ids,
        wordsLearned: row.words_learned,
        reviewsDone: row.reviews_done,
        quizAttempts: row.quiz_attempts,
        quizCorrect: row.quiz_correct,
        streak: row.streak,
        lastActivity: row.last_activity
          ? new Date(row.last_activity).toISOString().slice(0, 10)
          : null,
        activityDates: row.activity_dates.map((date: string | Date) =>
          new Date(date).toISOString().slice(0, 10),
        ),
        reviewItems: row.review_items,
      };
    } catch {
      throw new HttpException(
        { message: "Progress could not be loaded. Try again later." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Put("progress/me")
  async saveMyProgress(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const account = await this.requireAccount(request);
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        { message: "Progress data is not valid." },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.writeProgress(account.id, parsed.data);
      return { saved: true };
    } catch {
      throw new HttpException(
        { message: "Progress could not be saved. Try again later." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Delete("account/me")
  async deleteMyAccount(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const account = await this.requireAccount(request);
    const token = cookieToken(request);
    try {
      await this.database.query("DELETE FROM learner_accounts WHERE id = $1", [
        account.id,
      ]);
      if (token) {
        await this.database.query(
          "DELETE FROM learner_sessions WHERE token_hash = $1",
          [hash(token)],
        );
      }
      clearSessionCookie(response);
      return { deleted: true };
    } catch {
      throw new HttpException(
        { message: "The account could not be deleted. Please try again." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get("account/me/export")
  async exportMyAccount(@Req() request: AuthenticatedRequest) {
    const account = await this.requireAccount(request);
    try {
      const progress = await this.database.query(
        `SELECT completed_lessons, completed_lesson_ids, words_learned,
                daily_goal_minutes, speaking_card_ids, speaking_card_id,
                learning_preferences, daily_practice,
                reviews_done, quiz_attempts, quiz_correct, streak,
                last_activity, activity_dates, review_items
         FROM learner_progress WHERE account_id = $1`,
        [account.id],
      );
      return {
        exportedAt: new Date().toISOString(),
        account,
        progress: progress.rows[0] ?? null,
      };
    } catch {
      throw new HttpException(
        { message: "Your export could not be prepared. Please try again." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private publicAccount(row: AccountRow): Account {
    return { id: row.id, email: row.email, displayName: row.display_name, learningProfile: row.learning_profile };
  }

  private rateKey(bucket: string, identifier: string) {
    return createHmac(
      "sha256",
      process.env.AUTH_RATE_LIMIT_SECRET ??
        process.env.DATABASE_URL ??
        "local-development-only",
    )
      .update(`${bucket}:${identifier}`)
      .digest("hex");
  }

  private async guardRateLimit(bucket: string, identifier: string) {
    const keyHash = this.rateKey(bucket, identifier);
    try {
      const result = await this.database.query<{ attempts: number }>(
        `INSERT INTO auth_rate_limits (key_hash, attempts, expires_at)
         VALUES ($1, 1, now() + interval '15 minutes')
         ON CONFLICT (key_hash) DO UPDATE SET
           attempts = CASE WHEN auth_rate_limits.expires_at <= now()
             THEN 1 ELSE auth_rate_limits.attempts + 1 END,
           expires_at = CASE WHEN auth_rate_limits.expires_at <= now()
             THEN now() + interval '15 minutes' ELSE auth_rate_limits.expires_at END
         RETURNING attempts`,
        [keyHash],
      );
      await this.database.query(
        "DELETE FROM auth_rate_limits WHERE expires_at <= now()",
      );
      if (result.rows[0].attempts > 8) {
        throw new HttpException(
          {
            message: "Too many attempts. Please wait 15 minutes and try again.",
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: "Accounts are unavailable right now." },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async recordRateLimit(bucket: string, identifier: string) {
    const keyHash = this.rateKey(bucket, identifier);
    await this.database.query(
      `INSERT INTO auth_rate_limits (key_hash, attempts, expires_at)
       VALUES ($1, 1, now() + interval '15 minutes')
       ON CONFLICT (key_hash) DO UPDATE SET
         attempts = CASE WHEN auth_rate_limits.expires_at <= now()
           THEN 1 ELSE auth_rate_limits.attempts END,
         expires_at = CASE WHEN auth_rate_limits.expires_at <= now()
           THEN now() + interval '15 minutes' ELSE auth_rate_limits.expires_at END`,
      [keyHash],
    );
  }

  private async createSession(
    accountId: string,
    request: Request,
    response: Response,
  ) {
    const token = randomBytes(32).toString("base64url");
    try {
      await this.database.query(
        "DELETE FROM learner_sessions WHERE expires_at <= now()",
      );
      await this.database.query(
        `INSERT INTO learner_sessions (token_hash, account_id, expires_at)
         VALUES ($1, $2, now() + interval '30 days')`,
        [hash(token), accountId],
      );
      setSessionCookie(response, token);
    } catch {
      throw new HttpException(
        {
          message:
            "The account was created but sign-in could not finish. Please sign in.",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async getAccount(request: Request) {
    const token = cookieToken(request);
    if (!token) return null;
    await this.database.query(
      "DELETE FROM learner_sessions WHERE expires_at <= now()",
    );
    const result = await this.database.query<AccountRow>(
      `SELECT accounts.id, accounts.email, accounts.display_name, accounts.learning_profile
       FROM learner_sessions sessions
       JOIN learner_accounts accounts ON accounts.id = sessions.account_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
      [hash(token)],
    );
    if (!result.rowCount) return null;
    return { account: this.publicAccount(result.rows[0]), token };
  }

  private async requireAccount(request: AuthenticatedRequest) {
    const session = await this.getAccount(request);
    if (!session) {
      throw new HttpException(
        { message: "Sign in to sync your progress." },
        HttpStatus.UNAUTHORIZED,
      );
    }
    request.soriAccount = session.account;
    return session.account;
  }

  private async writeProgress(accountId: string, progress: ProgressPayload) {
    await this.database.query(
      `INSERT INTO learner_progress
       (learner_id, completed_lessons, completed_lesson_ids, words_learned, daily_goal_minutes, speaking_card_ids,
        speaking_card_id, learning_preferences,
        account_id, reviews_done, quiz_attempts, quiz_correct, streak, last_activity,
        activity_dates, review_items, daily_practice)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15::date[],$16::jsonb,$17::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET
         completed_lessons = EXCLUDED.completed_lessons,
         completed_lesson_ids = EXCLUDED.completed_lesson_ids,
         words_learned = EXCLUDED.words_learned,
         daily_goal_minutes = EXCLUDED.daily_goal_minutes,
         speaking_card_ids = EXCLUDED.speaking_card_ids,
         speaking_card_id = EXCLUDED.speaking_card_id,
         learning_preferences = EXCLUDED.learning_preferences,
         reviews_done = EXCLUDED.reviews_done,
         quiz_attempts = EXCLUDED.quiz_attempts,
         quiz_correct = EXCLUDED.quiz_correct,
         streak = EXCLUDED.streak,
         last_activity = EXCLUDED.last_activity,
         activity_dates = EXCLUDED.activity_dates,
         review_items = EXCLUDED.review_items,
         daily_practice = EXCLUDED.daily_practice,
         updated_at = now()`,
      [
        accountId,
        progress.completed,
        progress.completedLessonIds,
        progress.wordsLearned,
        progress.dailyGoalMinutes,
        progress.speakingCardIds,
        progress.speakingCardId,
        JSON.stringify(progress.learningPreferences),
        accountId,
        progress.reviewsDone,
        progress.quizAttempts,
        progress.quizCorrect,
        progress.streak,
        progress.lastActivity,
        progress.activityDates,
        JSON.stringify(progress.reviewItems),
        JSON.stringify(progress.dailyPractice),
      ],
    );
  }
}
