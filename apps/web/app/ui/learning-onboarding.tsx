"use client";
import { useState } from "react";
import { defaultLearningProfile } from "../learning-profile";
import { LearningProfileFields } from "./learning-profile-fields";
import { SoriMascot } from "./sori-mascot";
import type { LearnerAccount } from "./account-modal";
export function LearningOnboarding({
  account,
  onSaved,
  onSignOut,
}: {
  account: LearnerAccount;
  onSaved: (account: LearnerAccount) => void;
  onSignOut: () => Promise<void>;
}) {
  const [profile, setProfile] = useState(
    account.learningProfile ?? defaultLearningProfile,
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <main className="onboarding-shell">
      <section className="onboarding-card lesson-step-motion">
        <SoriMascot className="onboarding-mascot" />
        <span className="micro-label">WELCOME TO SAEGIM</span>
        <h1>Let’s find your starting point.</h1>
        <p>
          Three small choices for a learning path that fits you. Change them
          anytime in My Account → learning settings.
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setNotice("");
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/account/me`,
                {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    displayName: account.displayName,
                    learningProfile: {
                      ...profile,
                      onboardingCompleted: true,
                      dailyMinutes: profile.dailyMinutes ?? 15,
                    },
                  }),
                },
              );
              if (!response.ok)
                throw new Error(
                  "Your choices could not be saved. Please try again.",
                );
              onSaved(await response.json());
            } catch (error) {
              setNotice(
                error instanceof Error
                  ? error.message
                  : "Could not save your choices.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <LearningProfileFields profile={profile} onChange={setProfile} />
          <button
            className="button button-dark"
            disabled={busy || !profile.reasons.length}
          >
            {busy ? "Preparing your path…" : "Build my learning path"}
          </button>
        </form>
        {notice && <p role="alert">{notice}</p>}
        <button
          className="button button-quiet"
          disabled={busy}
          onClick={() => void onSignOut()}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
