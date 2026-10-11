import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { DatabaseService } from "./database.service";

export type SessionRequest = Request & { soriAccountId?: string };

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const token = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("sori_session="))
      ?.slice("sori_session=".length);
    if (!token) throw new UnauthorizedException("Sign in to open your studies.");

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await this.database.query<{ account_id: string }>(
      `SELECT account_id FROM learner_sessions
       WHERE token_hash = $1 AND expires_at > now()`,
      [tokenHash],
    );
    if (!session.rowCount) {
      throw new UnauthorizedException("Sign in to open your studies.");
    }
    request.soriAccountId = session.rows[0].account_id;
    return true;
  }
}
