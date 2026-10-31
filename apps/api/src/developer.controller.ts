import {Controller, ForbiddenException, Get, Header, Req, UseGuards} from "@nestjs/common";
import {DatabaseService} from "./database.service";
import {SessionAuthGuard, type SessionRequest} from "./session-auth.guard";
import {freeAllowance} from "./developer-health";
import {providerResults,providerSummary} from "./provider-health";
import {cloudflareAvailable,usesCloudflareTutor} from "./cloudflare-ai";

// The owner explicitly selected this existing account. Never accept an email
// from a request body, query parameter, browser profile or storage as authority.
export function isDeveloperEmail(email: unknown) {
  return email === "aeden.gray2@gmail.com";
}

@Controller("developer")
@UseGuards(SessionAuthGuard)
export class DeveloperController {
  constructor(private readonly database: DatabaseService) {}

  @Get("overview")
  @Header("Cache-Control", "private, no-store")
  async overview(@Req() request: SessionRequest) {
    if (!request.soriAccountId) throw new ForbiddenException("Developer access is restricted.");
    const account = await this.database.query<{email: string}>(
      "SELECT email FROM learner_accounts WHERE id = $1", [request.soriAccountId],
    );
    if (!isDeveloperEmail(account.rows[0]?.email)) throw new ForbiddenException("Developer access is restricted.");
    // Existing quota reservations only. No user identifiers or new collection.
    const usage = await this.database.query<{date: string; requests: number; tutorRequests: number;tutorTokens:string}>(
      `SELECT usage_date::text AS date, request_count AS requests,
              tutor_request_count AS "tutorRequests", tutor_token_count::text AS "tutorTokens"
       FROM provider_project_usage
       WHERE usage_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 29
       ORDER BY usage_date DESC LIMIT 30`,
    );
    const measuredAt=new Date().toISOString();
    const today=usage.rows.find(day=>day.date===measuredAt.slice(0,10))??null;
    return {usage: usage.rows, measuredAt,allowance:freeAllowance(today),
      aiConfigured:usesCloudflareTutor()?cloudflareAvailable():null,providerResults:providerResults(),providerSummary:providerSummary()};
  }
}
