import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { z } from "zod";

export type FirebaseGoogleIdentity = { uid: string; projectId: string; email: string; name: string };

// Called only after the Admin SDK verifies the signature, audience, expiry and
// revocation. These additional checks restrict our exchange to verified Google.
export function firebaseGoogleIdentity(claims: Record<string, any>, projectId: string, now = Date.now() / 1000): FirebaseGoogleIdentity {
  const email = z.string().email().max(120).safeParse(claims.email);
  if (!email.success || claims.email_verified !== true || claims.aud !== projectId ||
      claims.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof claims.uid !== "string" || !claims.uid || claims.uid.length > 128 || claims.sub !== claims.uid ||
      claims.firebase?.sign_in_provider !== "google.com" ||
      typeof claims.auth_time !== "number" || !Number.isFinite(claims.auth_time) ||
      claims.auth_time > now + 60 || claims.auth_time < now - 300) {
    throw new HttpException({ message: "Google sign-in could not be verified. Please start it again." }, HttpStatus.UNAUTHORIZED);
  }
  const normalized = email.data.toLowerCase();
  return { uid: claims.uid, projectId, email: normalized,
    name: (typeof claims.name === "string" ? claims.name.trim() : "").slice(0, 40) || normalized.split("@")[0].slice(0, 40) };
}

@Injectable()
export class FirebaseIdentityVerifier {
  private clientPromise?: Promise<import("firebase-admin/auth").Auth>;

  private client() {
    if (!this.clientPromise) this.clientPromise = this.initialize();
    return this.clientPromise;
  }

  private async initialize() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      throw new Error("Firebase server configuration unavailable");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (serviceAccount.project_id !== projectId || typeof serviceAccount.private_key !== "string" || typeof serviceAccount.client_email !== "string") {
      throw new Error("Firebase project configuration mismatch");
    }
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const name = "saegim-google-auth";
    const existing = getApps().find(app => app.name === name);
    if (existing && existing.options.projectId !== projectId) throw new Error("Firebase project configuration mismatch");
    return getAuth(existing ?? initializeApp({ projectId, credential: cert(serviceAccount) }, name));
  }

  async verify(idToken: string) {
    if (process.env.FIREBASE_AUTH_ENABLED !== "true") {
      throw new HttpException({ message: "Google sign-in is not enabled. Use email and password." }, HttpStatus.SERVICE_UNAVAILABLE);
    }
    let client: import("firebase-admin/auth").Auth;
    try { client = await this.client(); }
    catch { throw new HttpException({ message: "Google sign-in is not ready. Use email and password." }, HttpStatus.SERVICE_UNAVAILABLE); }
    try {
      const claims = await client.verifyIdToken(idToken, true);
      return firebaseGoogleIdentity(claims, process.env.FIREBASE_PROJECT_ID!);
    } catch {
      throw new HttpException({ message: "Google sign-in could not be verified. Please start it again." }, HttpStatus.UNAUTHORIZED);
    }
  }

  async deleteIdentity(projectId: string, uid: string) {
    if (projectId !== process.env.FIREBASE_PROJECT_ID) throw new HttpException({ message: "Google account cleanup is unavailable. Please try again later." }, HttpStatus.SERVICE_UNAVAILABLE);
    try { await (await this.client()).deleteUser(uid); }
    catch (error) {
      if ((error as { code?: string })?.code !== "auth/user-not-found") {
        throw new HttpException({ message: "Google account cleanup could not finish. Your learning data has not been deleted; please try again." }, HttpStatus.SERVICE_UNAVAILABLE);
      }
    }
  }
}
