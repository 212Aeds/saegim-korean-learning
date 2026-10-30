"use client";
import { useEffect, useRef, useState } from "react";
import { exchangeFirebaseAccount, FirebaseLinkRequiredError, firebasePopupMessage, prepareFirebaseGoogle } from "./firebase-google";
import type { LearnerAccount } from "./account-modal";
import styles from "./firebase-google-sign-in.module.css";

export function FirebaseGoogleSignIn({ apiUrl, busy, onBusy, onLinking, onAuthenticated }: {
  apiUrl: string; busy: boolean; onBusy: (busy: boolean) => void; onLinking: (linking: boolean) => void;
  onAuthenticated: (account: LearnerAccount) => Promise<void>;
}) {
  const active = useRef(true);
  const controller = useRef<Awaited<ReturnType<typeof prepareFirebaseGoogle>> | null>(null);
  const token = useRef<string | null>(null);
  const [ready, setReady] = useState(false), [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false), [password, setPassword] = useState(""), [message, setMessage] = useState("");

  async function prepare() {
    setLoading(true); setMessage("");
    try { const prepared = await prepareFirebaseGoogle(); if (active.current) { controller.current = prepared; setReady(true); } }
    catch { if (active.current) setMessage("Google sign-in couldn’t load. Email and password are available below."); }
    finally { if (active.current) setLoading(false); }
  }
  useEffect(() => {
    active.current = true; void prepare();
    return () => { active.current = false; token.current = null; onLinking(false); onBusy(false); };
  }, []);

  async function finish(idToken: string, currentPassword?: string) {
    try {
      const account = await exchangeFirebaseAccount(apiUrl, idToken, currentPassword);
      token.current = null;
      if (active.current) await onAuthenticated(account);
    } catch (error) {
      if (!active.current) return;
      if (error instanceof FirebaseLinkRequiredError) { setLinking(true); onLinking(true); }
      setMessage(error instanceof Error ? error.message : "Google sign-in could not finish. Try again.");
    } finally { if (active.current) { setPassword(""); onBusy(false); } }
  }
  function start() {
    if (!controller.current) { void prepare(); return; }
    onBusy(true); setMessage("");
    let pending: Promise<string>;
    try { pending = controller.current.start(); }
    catch (error) { setMessage(firebasePopupMessage(error)); onBusy(false); return; }
    pending.then(idToken => {
      if (!active.current) return;
      token.current = idToken; return finish(idToken);
    }).catch(error => { if (active.current) { setMessage(firebasePopupMessage(error)); onBusy(false); } });
  }
  function cancelLink() { token.current = null; setPassword(""); setMessage(""); setLinking(false); onLinking(false); }

  return <div className={styles.provider}>
    {linking ? <form onSubmit={event => { event.preventDefault(); if (token.current) { onBusy(true); void finish(token.current, password); } }}>
      <p>Connect Google to your existing account. Your saved lessons stay with it.</p>
      <label>Current Saegim password<input type="password" autoComplete="current-password" minLength={12} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button type="submit" className="button button-dark" disabled={busy}>{busy ? "Connecting…" : "Confirm password and connect Google"}</button>
      <button type="button" className="button button-quiet" disabled={busy} onClick={cancelLink}>Cancel connection</button>
    </form> : <>
      <button type="button" className={`button button-quiet ${styles.google}`} disabled={busy || loading} onClick={start}><img src="/google-sign-in-logo.png" alt="" width={20} height={20}/><span>{loading ? "Preparing Google sign-in…" : ready ? "Continue with Google" : "Try loading Google sign-in"}</span></button>
      <p className={styles.note}>Optional. Email/password and guest practice remain available.</p>
    </>}
    {message && <p className="account-message" role="alert">{message}</p>}
    {!linking && <p className={styles.divider}>Or use email and password</p>}
  </div>;
}
