import { randomBytes } from "node:crypto";
import { HttpException, HttpStatus } from "@nestjs/common";
import type { DatabaseService } from "./database.service";
import type { FirebaseGoogleIdentity } from "./firebase-identity";

type AccountRow = { id: string; email: string; display_name: string; password_hash: string; learning_profile: any };
type PasswordTools = { hashPassword: (password: string) => Promise<string>; verifyPassword: (password: string, encoded: string) => Promise<boolean> };

export async function resolveFirebaseAccount(database: Pick<DatabaseService, "transaction">, identity: FirebaseGoogleIdentity, currentPassword: string | undefined, tools: PasswordTools): Promise<AccountRow> {
  try {
    return await database.transaction(async client => {
      const bound = await client.query<AccountRow>(
        `SELECT a.id, a.email, a.display_name, a.password_hash, a.learning_profile
         FROM learner_firebase_identities i JOIN learner_accounts a ON a.id = i.account_id
         WHERE i.project_id = $1 AND i.firebase_uid = $2`, [identity.projectId, identity.uid]);
      if (bound.rows[0]) return bound.rows[0];
      const existing = await client.query<AccountRow>(
        "SELECT id, email, display_name, password_hash, learning_profile FROM learner_accounts WHERE email = $1 FOR UPDATE", [identity.email]);
      let account = existing.rows[0];
      if (account) {
        if (!currentPassword) throw new HttpException({ code: "ACCOUNT_LINK_REQUIRED", message: "Confirm your current Saegim password to connect Google and keep your saved progress." }, HttpStatus.CONFLICT);
        if (!await tools.verifyPassword(currentPassword, account.password_hash)) throw new HttpException({ message: "Your Saegim password doesn’t match. Google has not been connected." }, HttpStatus.UNAUTHORIZED);
      } else {
        // Google-only accounts still satisfy the existing hash constraint. This
        // random password is never exposed or offered as a password credential.
        const passwordHash = await tools.hashPassword(randomBytes(32).toString("base64url"));
        const created = await client.query<AccountRow>(
          "INSERT INTO learner_accounts (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name, password_hash, learning_profile",
          [identity.email, identity.name, passwordHash]);
        account = created.rows[0];
      }
      await client.query("INSERT INTO learner_firebase_identities (project_id, firebase_uid, account_id) VALUES ($1, $2, $3)", [identity.projectId, identity.uid, account.id]);
      return account;
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    if ((error as { code?: string })?.code === "23505") throw new HttpException({ message: "The Google connection changed. Try signing in again." }, HttpStatus.CONFLICT);
    throw new HttpException({ message: "Google sign-in is temporarily unavailable. Your existing sign-in and progress are unchanged." }, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
