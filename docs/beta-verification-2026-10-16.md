# Saegim beta verification — 16 October 2026

Primary site: https://saegim.onrender.com

Feedback: https://saegim.onrender.com/feedback/

## Verified

- 104 automated tests passed. Hosted web build and API production build passed. Production dependency audit reported zero vulnerabilities.
- All 162 packaged Chris/Jessica WAV clips passed the audio catalog integrity audit (27.2 MiB). Playback controls entered the playing state in the live lesson and Speak UI; automated playback tests cover completion, cancellation and pace.
- Public API health reported Neon connected. Through the primary website's `/api` rewrite, temporary registration, secure HttpOnly session cookie, account reload, logout and login passed. Temporary test accounts and their server data were removed.
- Real hosted Qwen answered a question and conversation turns. Real Whisper transcribed the packaged Korean greeting fixture as 안녕하세요. Live browser conversation displayed the Korean reply and romanization, and the starter phrase button filled and focused the composer. No personal microphone audio was captured for these checks.
- A complete beginner lesson and final quiz passed through the live UI. A wrong vowel answer could be corrected; both g and giyeok were accepted for ㄱ; the Korean keyboard composed ㄱ + ㅏ into 가. Completion unlocked the next lesson, added review items and persisted after reload. Review flip/rating and mixed practice were exercised. Word search found 가방 and its references.
- Changing the test account from beginner to advanced refreshed the path and speaking deck from letters to opinion phrases. Automated content tests cover level gates, prerequisites, distinct choices, review scheduling and question spacing; this does not mean each of the 116 lessons received a complete manual linguistic review.
- At 390 CSS pixels, Today, Learn, Words, Speak, AI Tutor and the feedback page had no horizontal document overflow. The tutor layout was visually inspected. The desktop app produced no captured browser console errors during the inspected flow.
- Feedback form published, email collection disabled, response summary sharing disabled and private response spreadsheet linked. A clearly labelled setup test submission was accepted and appeared in the form's response count. The QR decoded from a screenshot of the deployed page to the correct form URL.
- New static site security headers were checked over HTTPS. The old root address moved the browser to the new host with its fragment preserved; the old About URL returned HTTP 301 to the new About URL. The old API rewrite remains first.

## Corrections shipped

- Account sign-in and hosted speech readiness allow up to 75 seconds for free-hosting startup; account creation/login POSTs are not retried automatically.
- Hosted builds accept Korean browser-vendor voices while preferring installed voices. Explicit voice selection takes precedence over the default voice name. Live conversation checks for an available Korean voice before recording or inference.
- Hosted tutor receives checked Hangul lesson context. A live retest still generated an incorrect claim about one-letter blocks, so the narrow syllable-composition intent now returns an authored, source-attributed lesson explanation without model inference. The deployed API was retested and returned the correct written ㅇ + ㅏ = 아 explanation.
- Feedback is accessible from the landing footer, About and the in-app report area. Reports no longer require access to the private GitHub repository.

## Operating limits

This is a small beta, not a zero-defect certification or load-capacity guarantee. AI outputs outside the authored foundational answer can be inaccurate. Daily AI limits and free API cold starts still apply. New spoken replies depend on an available Korean browser voice; dynamic Chris/Jessica synthesis is not hosted. Recording-device compatibility, perceived pronunciation quality and every lesson's language accuracy still need human testers on their own devices. No paid service or domain registration was enabled.

Current deployed code: primary static site c7299a5; API and legacy handoff 58f6eb9. Both are on fix/windows-local-setup; later documentation commits do not require redeployment.
