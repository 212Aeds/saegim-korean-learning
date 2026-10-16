import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database.service";

export type ProviderFeature = "tutor" | "transcription" | "tts";
export type ProviderUsageDecision = {
  allowed: boolean;
  reason?: "account-limit" | "project-limit" | "spend-limit" | "unavailable";
};

export function positiveLimit(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2_147_483_647 ? number : null;
}

// Reservations are held even for failed calls, so retries cannot bypass caps.
export const TUTOR_TOKEN_RESERVATION = 16_000;
export const TUTOR_REQUEST_RESERVATION_MICRO_USD = 10_000;

@Injectable()
export class ProviderUsageService {
  constructor(private readonly database: DatabaseService) {}

  // Shared tutor/transcription reservations are atomic in PostgreSQL and never reserve money.
  async allowFreeInference(accountId: string): Promise<ProviderUsageDecision> {
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) return {allowed:false,reason:"unavailable"};
    const project=positiveLimit(process.env.FREE_AI_PROJECT_DAILY_LIMIT) ?? 200;
    const account=positiveLimit(process.env.FREE_AI_ACCOUNT_DAILY_LIMIT) ?? 25;
    try {
      const result=await this.database.query<{reason:string|null}>("SELECT reserve_tutor_request($1::uuid,$2::integer,$3::integer,$2::integer,$3::integer,$4::bigint,$5::bigint,$6::bigint) AS reason",[accountId,project,account,project*TUTOR_TOKEN_RESERVATION,account*TUTOR_TOKEN_RESERVATION,TUTOR_TOKEN_RESERVATION]);
      const reason=result.rows[0]?.reason;
      if(reason===null)return {allowed:true};
      return {allowed:false,reason:reason==="account-limit"?"account-limit":reason==="project-limit"?"project-limit":"unavailable"};
    } catch { return {allowed:false,reason:"unavailable"}; }
  }

  // Audio playback and transcription have no Sori-side usage quota. Tutor
  // requests reserve against the previously approved $5 monthly project cap.
  async allowAndRecord(
    accountId: string,
    feature: ProviderFeature,
    reservedMicroUsd = 0,
  ): Promise<ProviderUsageDecision> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId) ||
        !Number.isSafeInteger(reservedMicroUsd) || reservedMicroUsd < 0) {
      return { allowed: false, reason: "unavailable" };
    }
    if (feature === "tts" || feature === "transcription") return { allowed: true };
    if (feature !== "tutor" || reservedMicroUsd <= 0) {
      return { allowed: false, reason: "unavailable" };
    }

    const projectLimit = Math.max(
      positiveLimit(process.env.PROVIDER_DAILY_LIMIT) ?? 0,
      positiveLimit(process.env.TUTOR_PROJECT_DAILY_REQUEST_LIMIT) ?? 500,
    );
    const accountLimit = Math.max(
      positiveLimit(process.env.PROVIDER_ACCOUNT_DAILY_LIMIT) ?? 0,
      positiveLimit(process.env.TUTOR_ACCOUNT_DAILY_REQUEST_LIMIT) ?? 50,
    );
    if (!projectLimit || !accountLimit) return { allowed: false, reason: "unavailable" };

    try {
      const result = await this.reserveTutor(accountId, projectLimit, accountLimit, reservedMicroUsd);
      if (result.reason === null) return { allowed: true };
      if (result.reason === "account-limit" || result.reason === "project-limit" || result.reason === "spend-limit") {
        return { allowed: false, reason: result.reason };
      }
    } catch {
      // Never log provider credentials, learner IDs, or prompt content.
    }
    return { allowed: false, reason: "unavailable" };
  }

  private async reserveTutor(
    accountId: string,
    projectLimit: number,
    accountLimit: number,
    reservedMicroUsd: number,
  ) {
    const projectRequests = positiveLimit(process.env.TUTOR_PROJECT_DAILY_REQUEST_LIMIT) ?? 500;
    const accountRequests = positiveLimit(process.env.TUTOR_ACCOUNT_DAILY_REQUEST_LIMIT) ?? 50;
    const projectTokens = positiveLimit(process.env.TUTOR_PROJECT_DAILY_TOKEN_LIMIT) ?? 8_000_000;
    const accountTokens = positiveLimit(process.env.TUTOR_ACCOUNT_DAILY_TOKEN_LIMIT) ?? 800_000;
    if (projectTokens < TUTOR_TOKEN_RESERVATION || accountTokens < TUTOR_TOKEN_RESERVATION) {
      return { reason: "unavailable" };
    }
    const monthlyCapCents = positiveLimit(process.env.PROVIDER_MONTHLY_SPEND_CAP_CENTS) ?? 500;
    const monthlyCapMicroUsd = monthlyCapCents * 10_000;

    return this.database.transaction(async (client) => {
      await client.query(
        `INSERT INTO provider_monthly_spend (usage_month)
         VALUES (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date)
         ON CONFLICT DO NOTHING`,
      );
      const month = await client.query<{ reserved_micro_usd: string }>(
        `SELECT reserved_micro_usd FROM provider_monthly_spend
         WHERE usage_month = date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
         FOR UPDATE`,
      );
      const spent = Number(month.rows[0]?.reserved_micro_usd ?? 0);
      if (!Number.isSafeInteger(spent) || spent > monthlyCapMicroUsd - reservedMicroUsd) {
        return { reason: "spend-limit" };
      }

      const usage = await client.query<{ reason: string | null }>(
        "SELECT reserve_tutor_request($1::uuid, $2::integer, $3::integer, $4::integer, $5::integer, $6::bigint, $7::bigint, $8::bigint) AS reason",
        [accountId, projectLimit, accountLimit, projectRequests, accountRequests,
          projectTokens, accountTokens, TUTOR_TOKEN_RESERVATION],
      );
      const reason = usage.rows[0]?.reason;
      if (reason === undefined) return { reason: "unavailable" };
      if (reason !== null) return { reason };

      await client.query(
        `UPDATE provider_monthly_spend
         SET reserved_micro_usd = reserved_micro_usd + $1::bigint
         WHERE usage_month = date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date`,
        [reservedMicroUsd],
      );
      return { reason: null };
    });
  }
}
