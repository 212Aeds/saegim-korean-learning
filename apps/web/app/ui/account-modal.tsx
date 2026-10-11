"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle, SignOut, X } from "./icons";
import { useDialogFocus } from "./use-dialog-focus";
import type { LearningPreferences } from "../progress";

export type LearnerAccount = {
  id: string;
  email: string;
  displayName: string;
};

export function AccountModal({
  apiUrl,
  account,
  initialMode = "create",
  onClose,
  onAuthenticated,
  onSignOut,
  onDelete,
  preferences,
  onPreferencesChange,
  onAccountUpdated,
}: {
  apiUrl?: string;
  account: LearnerAccount | null;
  initialMode?: "create" | "login";
  onClose: () => void;
  onAuthenticated: (account: LearnerAccount) => Promise<void>;
  onSignOut: () => Promise<void>;
  onDelete: () => Promise<void>;
  preferences?: LearningPreferences;
  onPreferencesChange?: (preferences: LearningPreferences) => void;
  onAccountUpdated?: (account: LearnerAccount) => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogFocus(dialogRef, onClose);
  const [mode, setMode] = useState<"create" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState(account?.displayName ?? "");
  useEffect(() => setProfileName(account?.displayName ?? ""), [account?.displayName]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiUrl}/v1/auth/${mode === "create" ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
        },
      );
      const body = (await response.json()) as
        LearnerAccount | { message?: string };
      if (!response.ok || !("id" in body)) {
        setMessage(
          "message" in body
            ? (body.message ?? "We couldn’t sign you in. Please try again.")
            : "We couldn’t sign you in. Please try again.",
        );
        return;
      }
      await onAuthenticated(body);
      onClose();
    } catch {
      setMessage(
        "The account service is unavailable. Please try again once it reconnects.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await onSignOut();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl || !account || !onAccountUpdated) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/v1/account/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: profileName }),
      });
      const body = (await response.json()) as LearnerAccount | { message?: string };
      if (!response.ok || !("id" in body)) {
        throw new Error("message" in body ? body.message : "Your name could not be saved.");
      }
      setProfileName(body.displayName);
      onAccountUpdated(body);
      setMessage("Your name is saved. It will appear in your welcome message.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your name could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/v1/account/me/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export unavailable");
      const data = await response.json();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      link.download = "sori-learning-data.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setMessage("We couldn’t prepare your export. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your Sori account and synced progress? This cannot be undone. Your copy on this device will stay here.",
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch {
      setMessage("Your account could not be deleted. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop account-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
      >
        <div className="account-modal-top">
          <span className="account-mark" aria-hidden="true">
            한
          </span>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close account"
          >
            <X size={19} />
          </button>
        </div>
        {account ? (
          <div className="account-content">
            <h2 id="account-title">Your progress, together.</h2>
            <p>
              Signed in as <strong>{account.displayName}</strong> ·{" "}
              {account.email}
            </p>
            <div className="account-benefit">
              <CheckCircle size={20} />
              <span>
                Your lesson and review progress syncs to your account.
              </span>
            </div>
            <form className="account-profile-form" onSubmit={(event) => void saveProfileName(event)}>
              <label htmlFor="profile-name">Name to use around Sori</label>
              <div>
                <input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={40} required />
                <button className="button button-quiet" type="submit" disabled={busy || !profileName.trim() || profileName.trim() === account.displayName}>
                  Save name
                </button>
              </div>
            </form>
            {preferences && onPreferencesChange && (
              <section className="learning-preferences" aria-labelledby="learning-preferences-title">
                <div>
                  <span className="micro-label">MAKE IT YOURS</span>
                  <h3 id="learning-preferences-title">Learning comfort</h3>
                  <p>Your choices are saved with your account and restored across devices.</p>
                </div>
                <label className="preference-toggle">
                  <span><strong>Show romanization</strong><small>Keep pronunciation cues beside Hangul.</small></span>
                  <input
                    type="checkbox"
                    checked={preferences.romanization}
                    onChange={(event) => onPreferencesChange({ ...preferences, romanization: event.target.checked })}
                  />
                </label>
                <label>
                  Hangul size
                  <select
                    value={preferences.hangulSize}
                    onChange={(event) => onPreferencesChange({ ...preferences, hangulSize: event.target.value as LearningPreferences["hangulSize"] })}
                  >
                    <option value="standard">Standard</option>
                    <option value="large">Larger Hangul</option>
                  </select>
                </label>
                <label>
                  Hint detail
                  <select
                    value={preferences.hintLevel}
                    onChange={(event) => onPreferencesChange({ ...preferences, hintLevel: event.target.value as LearningPreferences["hintLevel"] })}
                  >
                    <option value="gentle">Gentle · more support</option>
                    <option value="standard">Standard · balanced</option>
                    <option value="challenge">Challenge · less detail</option>
                  </select>
                </label>
                <label>
                  Korean listening voice
                  <select
                    value={preferences.speechVoice}
                    onChange={(event) => onPreferencesChange({ ...preferences, speechVoice: event.target.value as LearningPreferences["speechVoice"] })}
                  >
                    <option value="jessica">Jessica</option>
                    <option value="chris">Chris</option>
                  </select>
                </label>
                <label className="preference-pace">
                  <span>Listening pace <strong>{preferences.speechPace.toFixed(2)}×</strong></span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.1"
                    step="0.05"
                    value={preferences.speechPace}
                    onChange={(event) => onPreferencesChange({ ...preferences, speechPace: Number(event.target.value) })}
                    aria-label="Default Korean listening pace"
                  />
                  <small>Normal is 1.00×. Move left for slower audio.</small>
                </label>
              </section>
            )}
            <div className="account-data-actions">
              <button
                className="button button-quiet"
                onClick={exportData}
                disabled={busy}
              >
                Download my learning data
              </button>
              <button
                className="account-delete"
                onClick={deleteAccount}
                disabled={busy}
              >
                Delete account and synced progress
              </button>
            </div>
            {message && (
              <p className="account-message" role="alert">
                {message}
              </p>
            )}
            <button
              className="button button-quiet account-action"
              onClick={signOut}
              disabled={busy}
            >
              <SignOut size={17} /> Sign out
            </button>
          </div>
        ) : (
          <div className="account-content">
            <h2 id="account-title">Keep your Korean growing.</h2>
            <p>
              Create a free account to carry lessons and review cards between
              devices.
            </p>
            <div
              className="account-tabs"
              role="tablist"
              aria-label="Account action"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                className={mode === "create" ? "selected" : ""}
                onClick={() => setMode("create")}
              >
                Create account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "selected" : ""}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </div>
            {apiUrl ? (
              <form className="account-form" onSubmit={submit}>
                {mode === "create" && (
                  <label>
                    Name
                    <input
                      autoComplete="name"
                      maxLength={40}
                      required
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="What should we call you?"
                    />
                  </label>
                )}
                <label>
                  Email
                  <input
                    autoComplete="email"
                    type="email"
                    maxLength={120}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete={
                      mode === "create" ? "new-password" : "current-password"
                    }
                    type="password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="12 characters or more"
                  />
                  {mode === "create" && (
                    <small>Use at least 12 characters.</small>
                  )}
                </label>
                {message && (
                  <p className="account-message" role="alert">
                    {message}
                  </p>
                )}
                <button
                  className="button button-dark account-submit"
                  disabled={busy}
                >
                  {busy
                    ? "One moment…"
                    : mode === "create"
                      ? "Create free account"
                      : "Sign in"}
                  {!busy && <ArrowRight size={17} />}
                </button>
              </form>
            ) : (
              <div className="account-message" role="status">
                Connect the PostgreSQL account service to create or sign in.
                Study content stays private until you have an account.
              </div>
            )}
            <p className="account-private">
              No subscriptions. No ads. Passwords are never stored in plain
              text.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
