# Beta flow audit — 2026-10-23

## Exact reported defect

The screenshot identified **Practiced · Next card**, not the sound preference toggle. That completed-card branch only called navigation, so no feedback sound was requested. The first-time completion branch already requested it. AI-assisted patch 249ba2e adds the same optional feedback to the completed-card tap before navigation. It neither awards completion again nor adds sound to ordinary previous/next browsing. The existing mute preference remains authoritative; Chris/Jessica and all voice pace settings are unchanged.

A component-action regression reproduced zero sound requests across three completed-card taps before the patch. It now verifies three feedback requests, correct wraparound navigation, and no completion awards. Existing native audio tests cover mute, playback rejection/retry, interrupted priming, and repeat taps.

## Automated verification

- 227 local tests passed, including four pre-existing untracked preview tests that remain unpublished.
- API build and hosted web build passed.
- All 1,878 catalogued recordings passed file validation, including 798 Hangul block recordings. The feedback WAV is validated separately. File validation cannot establish pronunciation quality.
- Every speaking card at all five levels, with empty and complete prerequisite histories, resolves its selected Chris/Jessica recording in the lifecycle test. These are synthetic media tests, not physical-device recognition tests.
- Startup JavaScript: 352,763 gzip bytes referenced by the exported homepage, below the existing 360,000-byte budget. This is a size check, not a measured page speed improvement.
- Production dependency audit reported zero known vulnerabilities.

The suite covers lesson answer matching/retry, proficiency separation, review scheduling, guest storage isolation, account requests/session restoration, AI conversation/history/reply-helper behavior, speech recording lifecycle and quiet/noisy/high-rate synthetic fixtures, audio cancellation/timeouts/tensor cleanup, reminders, and page suspension. It does not prove every feature is bug-free.

## Actual browser checks

Used the built hosted site on a separate localhost origin for synthetic guest progress. Existing live account settings/progress were not edited. A 390×844 viewport checked responsive layout; document content measured 375 pixels with no horizontal overflow in the checked guest views. This is desktop Chromium at phone width, not iPhone Safari.

- Landing: header, guest entry, signup/sign-in tabs and close control, founder story, feedback/navigation links visible.
- Guest onboarding: new learner, default interests, path creation; foundations recommended before vocabulary.
- Settings: dialog rendered within phone width; placement, goals, comfort settings and optional calendar controls available. No real-account changes or reminder subscriptions.
- Learn: prerequisite locks, briefing, Jessica playback, transition to practice, `g` accepted for ㄱ. A wrong vowel answer returned after the next item and succeeded on retry. Three-question quiz completed; review cards and the next lesson became available in the local guest session.
- Review: listening, flip/reveal, remembered rating, next card, exit.
- Practice: hub, foundation restrictions, Hangul tile selection, correct block feedback and round exit.
- Words: search for `food` produced 음식; its audio action worked. References and topic controls rendered.
- Live AI: unchecked lesson-word sharing before synthetic lunch dialogue. Starter returned a Korean lunch question. Suggest a reply returned an editable kimchi-stew answer; Use this phrase inserted it; Send produced a relevant follow-up. Another request for rice produced a further contextual turn. The free allowance was not exhausted during these checks, which does not establish capacity for beta traffic.
- Live TTS: Chris bubble replay reached ended state at 4.04 seconds with no media error; a repeated replay was usable. Read-aloud toggled on; the next synthetic reply played to ended at 3.42 seconds. Restored read-aloud off afterward. These durations are audio lengths, not startup latency measurements.
- Console: no warnings/errors observed in the checked guest and live tabs.

## Limits and launch decision

No microphone was recorded and no private learner content was sent as a fixture. A new password login, physical touchscreen, iPhone interruption/silent-mode behavior, long-running load, and every authored lesson were not manually tested. Automated catalog tests cover more content than the sampled UI walkthrough.

The current browser voice engine can still take several seconds to synthesize novel conversation text. API cold starts and hosted provider quotas remain possible on the free services. There is no basis to promise zero lag or guarantee that quotas will not be reached. No billing, credentials, permissions, providers, models, dependencies, or caps were changed in this pass. AI dialogue remains imperfect: one lunch exchange repeated a similar follow-up, so this is appropriate for a small monitored beta rather than a claim of polished human-level conversation.

Deployed 249ba2e through the existing free Render static site, deployment dep-dbdohhjrjlhs73b0a4e0 (Live, 1m13s). API code was unchanged. The exact completed-card button was clicked in the deployed UI: navigation advanced and the count remained 28/28, with feedback enabled and no console warning/error. The synthetic guest deck also reached 4/4 and the completed-card action advanced without increasing that count. Guest level change to basic saved and refreshed into a vocabulary-appropriate roadmap.

Post-deployment HTTP checks returned 200 for home, guides, the Hangul guide, about, privacy, feedback, robots, sitemap, health, and feedback WAV. A single warmed desktop check measured 588 ms for the homepage request and 197 ms for health; these are HTTP request durations, not full render times or guarantees for mobile/cold starts.
