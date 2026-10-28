# Beginner first session — October 28

The creator accepted the recommendation to improve a beginner's first session before expanding more sections. Inspection found that lesson sequencing already starts with Hangul, but Today puts several goal, quest, garden and roadmap widgets ahead of the lesson.

Implement a focused Today view for learners placed at brand-new level while they work through the first three existing lessons. Show one next-lesson action, topic/expectations and a three-step route drawn from the actual curriculum. Keep all normal navigation available and offer a full-dashboard option for the current app session. Learners at other levels, with other completed lessons, or finished with these three steps keep their existing Today view. Do not change completion, XP, prerequisites, audio, model settings, lesson grading or account storage.

Offer optional first-session feedback through the existing feedback page after a completed starter lesson, without sending data automatically. No new Korean claims or unreviewed curriculum are introduced; titles, sequencing and introductory text reuse the existing course and its lesson references.

Implementation plan: failing journey tests; pure route helper and small responsive component; integrate in Today with a session-only dashboard preference; run focused/full tests and hosted build; browser-check guest onboarding, lesson launch and navigation. Publish only after verification. Keep plain-language evidence in this file. This is one onboarding improvement, not a claim that the whole beginner course has been audited or that popularity increased.

## Implementation and verification

The first three lessons are derived from the actual beginner route: Hello, Hangul; Vowels: a, eo, i; Vowels: o, u, eu. The guide preserves prerequisite checks and never writes progress. It is suppressed for other proficiency levels, progress outside these steps, or completion of all three. The full-dashboard choice is held in app memory per account for the current session; it is not a new tracking identifier or saved account preference.

Browser inspection also found the first authored choice question was being replaced by an automatically selected speaking turn. The first three starter lessons now keep their authored choice/typing questions in practice and quiz. Listening and letter introductions remain, and speaking elsewhere is unchanged. Starter Today no longer shows the repeated feedback banner or streak prompt above the lesson. No new Korean claims were authored: existing lesson descriptions and briefings remain the source, with their existing references inside the lesson.

250 local tests passed, including the pre-existing unpublished feature-preview tests. New tests cover route identity, prerequisite progression, input/progress preservation, existing-learner exclusions and the narrow starter-question policy. A test mock for an unrelated audio-transition fixture was updated for the added policy import; its original audio-cancellation assertions remain unchanged. Hosted build passed at 354,834 gzip startup bytes locally, within the 360,000-byte budget.

A separate localhost guest fixture was onboarded as brand-new with family interest. Browser clicks completed Hello, Hangul practice and quiz (3/3 first-attempt quiz answers), accepted ah for the vowel, saved completion, selected the next vowel lesson and exposed optional feedback. The authored first choice prompt appeared instead of the speaking prompt. The full-dashboard preference survived Learn-to-Today navigation. No microphone, real learner account, private user data or feedback submission was used. This is desktop browser verification, not physical-phone testing. The existing audit still reports four high and one moderate dependency finding; dependencies did not change here.

AI assisted implementation and verification. Live deployment verification is recorded after publication. Rollback removes the new Today guide and starter-question condition; no database migration or progress reset is needed.


## Live publication

Commit 91b5150 deployed successfully to the existing free static service as dep-dbh6cguk1f9s73ejpth0. Render's startup gzip budget was 356,180 bytes, below 360,000. The production homepage returned HTTP 200 and its published public JavaScript contained the starter component. Production guest onboarding was not repeated against a real account; the complete guest browser test used the separate localhost origin described above. No API deployment was necessary.

A local preview remains at http://127.0.0.1:3042/ with synthetic guest progress after the first lesson, so the creator can inspect the next-step and feedback view without signing out of their real account. Reloading resets only the in-memory full-dashboard preference, not completed guest lessons. No physical-phone or increased-conversion claim is made.

