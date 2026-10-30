import type { LearnerAccount } from "./account-modal";

export const firebaseGoogleConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : null;

let preparation: Promise<{ start: () => Promise<string> }> | undefined;
export function prepareFirebaseGoogle() {
  if (!firebaseGoogleConfig) return Promise.reject(new Error("Google sign-in is not configured"));
  if (!preparation) preparation = (async () => {
    const { initializeApp, getApps } = await import("firebase/app");
    const { initializeAuth, inMemoryPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut } = await import("firebase/auth");
    const name = "saegim-google-sign-in";
    const app = getApps().find(app => app.name === name) ?? initializeApp(firebaseGoogleConfig!, name);
    const auth = initializeAuth(app, { persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver });
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return { start() {
      // Invoke the popup synchronously from a click, after preparation. Importing
      // the SDK inside this click would lose Safari's user-activation window.
      return signInWithPopup(auth, provider).then(async result => {
        try { return await result.user.getIdToken(true); }
        finally { await signOut(auth); }
      });
    }};
  })().catch(error => { preparation = undefined; throw error; });
  return preparation;
}

export class FirebaseLinkRequiredError extends Error {}
export async function exchangeFirebaseAccount(apiUrl: string, idToken: string, currentPassword?: string): Promise<LearnerAccount> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/v1/auth/firebase`, { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(75000),
      body: JSON.stringify({ idToken, ...(currentPassword ? { currentPassword } : {}) }),
    });
  } catch { throw new Error("The account service could not be reached. You can try again or use email and password."); }
  const body = await response.json().catch(() => null);
  if (response.status === 409 && body?.code === "ACCOUNT_LINK_REQUIRED") throw new FirebaseLinkRequiredError("Confirm your current Saegim password to connect Google and keep your saved progress.");
  if (!response.ok) throw new Error(typeof body?.message === "string" ? body.message : "Google sign-in could not finish. Please try again.");
  if (typeof body?.id !== "string" || typeof body.email !== "string" || typeof body.displayName !== "string") throw new Error("Your account response was incomplete. Please try signing in again.");
  return body;
}

export function firebasePopupMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Google sign-in was cancelled. You can keep practicing or try again.";
  if (code === "auth/popup-blocked") return "Your browser blocked the Google window. Allow pop-ups for Saegim, or use email and password.";
  if (code === "auth/network-request-failed") return "Google could not connect. Check your connection or use email and password.";
  return "Google sign-in could not open. You can use email and password below.";
}
