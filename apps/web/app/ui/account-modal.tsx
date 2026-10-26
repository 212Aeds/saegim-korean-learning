"use client";
import { freePublishing, paidFeaturesEnabled, deviceProgressKey, hostedAiEnabled } from "../release";
import { localSpeechUrl } from "./local-speech-server";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle, SignOut, X } from "./icons";
import { useDialogFocus } from "./use-dialog-focus";
import type { LearningPreferences } from "../progress";
import { defaultLearningProfile, type LearningProfile } from "../learning-profile";
import { LearningProfileFields } from "./learning-profile-fields";
import { avatars, accountAvatar } from "../account-personalization";
import {requestAccount} from "./account-request";
import {StudyReminders} from "./study-reminders";
import { ProfilePreview } from "./profile-preview";

export type LearnerAccount = {
  developerAccess?: boolean;
  id: string;
  email: string;
  displayName: string;
  learningProfile?: LearningProfile;
  learningProgress?: unknown;
};

export function AccountModal({
  apiUrl,
  account,
  initialMode = "create",
  settingsOnly = false,
  onOpenSettings,
  onClose,
  onAuthenticated,
  onSignOut,
  onDelete,
  preferences,
  onPreferencesChange,
  onAccountUpdated,
  completedLessonIds = [],
}: {
  apiUrl?: string;
  account: LearnerAccount | null;
  initialMode?: "create" | "login";
  settingsOnly?: boolean;
  onOpenSettings?: () => void;
  onClose: () => void;
  onAuthenticated: (account: LearnerAccount) => Promise<void>;
  onSignOut: () => Promise<void>;
  onDelete: () => Promise<void>;
  preferences?: LearningPreferences;
  onPreferencesChange?: (preferences: LearningPreferences) => void;
  onAccountUpdated?: (account: LearnerAccount) => void | Promise<void>;
  completedLessonIds?: string[];
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogFocus(dialogRef, onClose);
  const [mode, setMode] = useState<"create" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible,setPasswordVisible]=useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState(account?.displayName ?? "");
  const [learningProfile, setLearningProfile] = useState(account?.learningProfile ?? defaultLearningProfile);
  useEffect(()=>{setPasswordVisible(false);setMessage("");setPassword("");},[mode]);
  const profileChanged = JSON.stringify(learningProfile) !== JSON.stringify(account?.learningProfile ?? defaultLearningProfile);
  useEffect(() => setProfileName(account?.displayName ?? ""), [account?.displayName]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      const body=await requestAccount(apiUrl,mode,{email,password,displayName,...(mode === "create"?{learningProfile}:{})});
      await onAuthenticated(body);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t sign you in. Please try again.");
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
    if (!account || !onAccountUpdated) return;
    if (freePublishing || account?.id === "device-only") { await onAccountUpdated({...account,displayName:profileName.trim(),learningProfile}); setMessage("Settings saved on this device."); return; }
    if (!apiUrl) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/v1/account/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: profileName, learningProfile }),
      });
      const body = (await response.json()) as LearnerAccount | { message?: string };
      if (!response.ok || !("id" in body)) {
        throw new Error("message" in body ? body.message : "Your name could not be saved.");
      }
      setProfileName(body.displayName);
      await onAccountUpdated(body);
      setMessage("Your profile is saved. Your next lesson is tailored to your level and interests.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your name could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    if (freePublishing || account?.id === "device-only") {
      const url=URL.createObjectURL(new Blob([JSON.stringify({account,progress:JSON.parse(window.localStorage.getItem(deviceProgressKey)??"null")},null,2)],{type:"application/json"}));
      const link=document.createElement("a"); link.href=url; link.download="saegim-device-backup.json"; link.click(); URL.revokeObjectURL(url); return;
    }
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
      link.download = "saegim-learning-data.json";
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
      (freePublishing || account?.id === "device-only") ? "Clear learning data on this device? Export a backup first. This cannot be undone." : "Delete your Saegim account and synced progress? This cannot be undone. Your copy on this device will stay here.",
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
            {accountAvatar(learningProfile)}
          </span>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={settingsOnly ? "Close Settings" : "Close Account"}
          >
            <X size={19} />
          </button>
        </div>
        {account ? (
          <div className="account-content">
            <h2 id="account-title">{settingsOnly ? "Settings, at your pace." : "Your Account."}</h2>
            <p>
              {(freePublishing || account?.id === "device-only") ? "Practicing on this device as" : "Signed in as"} <strong>{account.displayName}</strong> ·{" "}
              {account.email}
            </p>
            <div className="account-benefit">
              <CheckCircle size={20} />
              <span>
                {(freePublishing || account?.id === "device-only") ? "Progress stays in this browser and does not sync. Keep a backup before clearing browser data." : "Your lesson and review progress syncs to your account."}
              </span>
            </div>
            {!settingsOnly && onOpenSettings && <button className="button button-soft" onClick={onOpenSettings}>⚙ Open Settings</button>}
            <ProfilePreview name={settingsOnly ? profileName : account.displayName} profile={learningProfile} completed={completedLessonIds} />
            {settingsOnly && <form className="account-profile-form" onSubmit={(event) => void saveProfileName(event)}>
              <label htmlFor="profile-name">Name to use around Saegim</label>
              <div>
                <input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={40} required />
                <button className="button button-quiet" type="submit" disabled={busy || !profileName.trim() || !learningProfile.reasons.length || (!profileChanged && profileName.trim() === account.displayName)}>
                  Save settings
                </button>
              </div>
              <details className="account-learning-settings" open><summary aria-label="Learning settings">⚙ Learning settings</summary><LearningProfileFields profile={learningProfile} onChange={setLearningProfile} /></details>
              <fieldset className="learning-profile-fields"><legend>Make it yours</legend><span>Choose your avatar</span><div className="avatar-choices">{Object.entries(avatars).map(([id, symbol]) => <button key={id} type="button" aria-label={`Choose ${id} avatar`} aria-pressed={(learningProfile.avatar ?? "sprout") === id} onClick={() => setLearningProfile({ ...learningProfile, avatar: id as NonNullable<LearningProfile["avatar"]> })}>{symbol}</button>)}</div><label>Your weekly study goal<select value={learningProfile.weeklyGoal ?? 5} onChange={(event) => setLearningProfile({ ...learningProfile, weeklyGoal: Number(event.target.value) as 3 | 5 | 7 })}><option value={3}>3 days · a gentle start</option><option value={5}>5 days · a steady rhythm</option><option value={7}>7 days · a daily habit</option></select></label></fieldset>
            </form>}
            {settingsOnly && <StudyReminders/>}
            {settingsOnly && preferences && onPreferencesChange && (
              <section className="learning-preferences" aria-labelledby="learning-preferences-title">
                <div>
                  <span className="micro-label">MAKE IT YOURS</span>
                  <h3 id="learning-preferences-title">Learning comfort</h3>
                  <p>{(freePublishing || account?.id === "device-only") ? "Your choices are saved in this browser." : "Your choices are saved with your account and restored across devices."}</p>
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
                {(paidFeaturesEnabled || localSpeechUrl) && <label>
                  Korean listening voice
                  <select
                    value={preferences.speechVoice}
                    onChange={(event) => onPreferencesChange({ ...preferences, speechVoice: event.target.value as LearningPreferences["speechVoice"] })}
                  >
                    <option value="jessica">Jessica</option>
                    <option value="chris">Chris</option>
                  </select>
                </label>}
                <label className="preference-pace">
                  <span>Listening pace <strong>{preferences.speechPace.toFixed(2)}×</strong></span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.4"
                    step="0.05"
                    value={preferences.speechPace}
                    onChange={(event) => onPreferencesChange({ ...preferences, speechPace: Number(event.target.value) })}
                    aria-label="Default Korean listening pace"
                  />
                  <small>Normal is 1.00×. Move left for slower audio or right for faster audio.</small>
                </label>
              </section>
            )}
            {!settingsOnly && <div className="account-data-actions">
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
                {(freePublishing || account?.id === "device-only") ? "Clear this device’s learning data" : "Delete account and synced progress"}
              </button>
            </div>}
            {message && (
              <p className="account-message" role="alert">
                {message}
              </p>
            )}
            {!settingsOnly && <button
              className="button button-quiet account-action"
              onClick={signOut}
              disabled={busy}
            >
              <SignOut size={17} /> {(freePublishing || account?.id === "device-only") ? "Back to welcome" : "Sign out"}
            </button>}
          </div>
        ) : (
          <div className="account-content">
            <h2 id="account-title">{mode === "login" ? "Welcome back to Saegim." : "Keep your Korean growing."}</h2>
            <p>
              {mode === "login" ? "Sign in to pick up your saved lessons and review cards." : "Create a free account to carry lessons and review cards between devices."}
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
                Create Account
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
                    type={passwordVisible?"text":"password"}
                    minLength={12}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="12 characters or more"
                  />
                  <button type="button" className="account-password-toggle" aria-pressed={passwordVisible} onClick={()=>setPasswordVisible(value=>!value)}>{passwordVisible?"Hide password":"Show password"}</button>
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
                  disabled={busy || (mode === "create" && !learningProfile.reasons.length)}
                >
                  {busy
                    ? "One moment…"
                    : mode === "create"
                      ? "Create free account"
                      : "Sign in"}
                  {!busy && <ArrowRight size={17} />}
                </button>
                {busy && hostedAiEnabled && <p className="account-private" role="status">Connecting to your account. After a quiet spell, the service can take about a minute to wake up.</p>}
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
