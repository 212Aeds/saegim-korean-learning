Speak and conversation follow-up: Speak cards now use explicit Stop & check with the existing 30-second capture cap, rather than offering pause settings that may be unreliable around background noise. Live voice conversation retains automatic endpoint detection. A synthetic test verifies that manual Speak capture stays open beyond ten seconds of quiet and releases the microphone exactly once when stopped.

Conversation reply help uses a separate validated reply-help mode on the existing authenticated, quota-limited endpoint. It passes the recent dialogue and latest partner question, asks for an editable learner answer, and does not append suggestions to conversation history or send the answer for the learner. The UI clears suggestions when the dialogue changes, cancels stale requests, and lets learners edit the phrase before sending. Normal conversation instructions explicitly answer the latest learner question or acknowledge a concrete detail before a related follow-up. Mock-provider tests prove the actual latest transcript and previous exchange reach the provider; they do not prove all generated dialogue is linguistically perfect or always different.

Automatic cached file preparation remains on page load, separate from model inference. The large technical conversation voice setup box was removed; only a brief Preparing audio status or retry action remains when necessary. First-visit network preparation can still take time. No paid providers, accounts, credentials, permissions, progress or usage caps changed. AI assistance was used to implement and verify this increment. Browser checking used the actual component with synthetic question/answer fixtures, no microphone recordings or private provider prompts.

Mobile update: see [the compact voice decision and test evidence](mobile-tts-2026-10-21.md). The new phone profile supersedes the earlier blanket unknown-memory iPhone block documented below.

# How Saegim works — a guided code walkthrough

Phone/cellular reliability follow-up (October 21): a bounded streaming reader removes the retained-chunks-plus-full-copy allocation during voice downloads and rejects incomplete files before model initialization. Phones, cellular/slow connections and data-saving mode do not automatically start the large model. Reported low-memory devices and phones with unknown memory use a conservative speak-and-read path. This is an application safety policy, not hardware certification. Start conversation prepares eligible voices on demand instead of remaining disabled. The fallback captures microphone turns and displays generated text replies; it does not pretend recorded phrases are generated speech. Worker errors terminate the worker and release pending requests.

References: [ONNX Runtime large-model memory constraints](https://onnxruntime.ai/docs/tutorials/web/large-models.html), [MDN approximate, limited-availability deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory). Synthetic device/network hints, stream disconnects and worker failures are tested. No physical phone/cellular-network testing is claimed. The exact reported device-specific crash remains unconfirmed pending device/browser details. No paid provider, model/preset change or account migration is involved.

Audio release safeguard (October 21, 2026): the hosted build runs the audio audit before compiling. It checks declared WAV/container lengths, complete chunk boundaries, nonempty PCM16 mono samples, and both block voices. Synthetic malformed buffers prove that truncated files fail while valid padded metadata passes. This AI-assisted engineering change protects file integrity; it does not certify pronunciation or make speech recognition perfect. All 1,870 current recordings passed the audit.

This explains the current implementation, not a claim that every design is final. The app was developed iteratively with AI assistance in this project thread. Being able to explain and verify a change matters more than claiming to have typed every line manually.

## Why the app exists

The creator wanted to learn Korean to connect with family, and found subscriptions and unsuitable lessons frustrating. That led to a free-first beta with level-specific paths, referenced material, listening and recall. The useful outcome is an understandable learning session, not maximizing time spent. Guest access and gentle, optional reminders follow that goal.

## Start here in the source

1. `apps/web/app/page.tsx` coordinates the current section, account, progress and open dialogs. React state changes the visible interface; effects restore and persist data. Large inactive interfaces use Next dynamic imports so visitors do not need all their code immediately.
2. `apps/web/app/curriculum.ts` combines authored lesson collections. `learning-profile.ts` chooses suitable starting material and prerequisites. A self-reported level opens appropriate starting lessons; it does not mark earlier lessons mastered.
3. `apps/web/app/ui/lesson-questions.ts` prepares varied lesson questions. `lesson-modal.tsx` runs practice and quiz phases. Missed questions return later. Retries do not increase the first-attempt score. `lesson-answer.ts` accepts existing approved alternatives and conservative English spelling slips with a correction note; it is not unrestricted semantic grading.
4. `apps/web/app/progress.ts` defines progress and review updates. Guest data uses separate browser keys from account progress. `ui/guest-learning.tsx` tells nested practice components which mode is active. Guests get listening/writing practice; protected AI requests still require an account.
5. `apps/api/src` contains the Nest API. Authentication guards protect account progress, tutor and transcription routes. The database connection uses configuration stored outside committed source. Do not put credentials in browser code or examples.
6. `apps/web/app/ui/tutor-page.tsx` sends a question with bounded recent dialogue and selected completed-lesson references. `tutor-conversation.tsx` manages chat, replay and voice-turn states. `apps/api/src/tutor` validates requests and applies the existing hosted inference policy. Model output can still be mistaken; this is not a fluent-teacher guarantee.
7. `ui/speech.ts` prepares and plays recorded Chris/Jessica clips. `browser-voices.ts` prepares the matching conversation voice model automatically on eligible desktops and on demand on eligible phones and synthesizes new audio on the device. `conversation-recording.ts` captures bounded turns; `local-speech-server.ts` prepares WAV data and requests transcription. Cancellation guards stop further preparation/upload after a canceled turn. Transcription is a wording aid, not a pronunciation score.

## Three concrete journeys

**A new guest:** open the landing page, choose no-email learning, pick a level/goals/time, then study. Progress stays in that browser. Clearing site data can erase it. No account server needs to finish before public content is shown.

**A signed-in learner:** the browser restores the session and loads saved progress before enabling account writes. An existing account's saved progress takes precedence over guest progress. An empty account can inherit the current guest session. A version guard prevents a late background session response from replacing a newly chosen guest or explicit login flow.

**A speech turn:** the learner explicitly starts recording, pauses for their selected interval, and submits bounded audio for transcription. The UI can show the recognized Korean and romanization. A recognition mismatch waits for confirmation rather than automatically counting as a wrong answer. Cancellation must stop later work and stale results must not replace a newer attempt.

## Why these tradeoffs were made

- Free hosting and capped hosted inference keep spending controlled, but can introduce cold starts and busy periods. Free does not mean unlimited capacity.
- Recorded audio gives stable voices for authored material. The approximately 430 MB browser model extends those voices to novel conversation, at a device/storage cost. Eligible desktops prepare it automatically after page render; phones and constrained connections wait for a user action; the initial transfer and device inference still take time. Fixed reading blocks and Speak cards have hosted recordings and do not wait for that model.
- Browser storage makes no-email learning possible without opening anonymous AI endpoints. The tradeoff is no automatic cross-device backup for guests.
- Startup JavaScript was measured before and after deferring interfaces. `npm run perf:startup` reports exported home script sizes and enforces a 360,000-byte gzip budget. This is an asset-size metric, not proof of a particular phone load time.
- Sharing, feedback and calendar reminders are user-controlled. Donation features remain off; email reminders are preparation only. No new attention analytics or automatic contact campaigns are enabled.

## How to investigate a change yourself

Pick one user action and trace its button handler to the state change, storage update or API call. Ask: what input is accepted, what fails, what happens when canceled, and which test proves the behavior? Read a small function first rather than trying to memorize the whole app.

Useful commands from the repository root:

```sh
npm test
npm run audio:check
npm run build:hosted
npm run perf:startup
```

The hosted build requires `NEXT_PUBLIC_API_URL` to be set to the existing API URL or `/api`; use the existing deployment configuration. Do not publish secret environment files. Tests use synthetic fixtures, not the user's microphone or private conversations. A passing build does not replace actual phone testing, native Korean review or a small invited beta.

## A truthful interview explanation

“I started this project to make Korean learning more accessible for people connecting with family. I used AI assistance, then reviewed and tested changes. Feedback showed that first visits waited on account services, so I separated public rendering from account restoration and added guest learning. I measured startup script size before and after code splitting. I chose optional accounts and user-controlled reminders rather than collecting attention data by default.”

Use that as a starting point, not a script to recite. Only claim decisions and results you can explain. The dated documents in `docs/` contain the detailed evidence and limits.

October 21, mobile Listen follow-up: Listen now unlocks its reusable audio element inside the tap gesture before awaiting synthesis. Chat controls have 44px minimum touch targets, wrapping replies and 16px mobile composer text. Unsupported novel replies explicitly say audio is unavailable rather than offering an apparently broken Listen action; fixed recordings remain playable. The synthesis adapter releases per-utterance tensors in finally, including failure paths, and releases denoising-step inputs/outputs immediately after copying their data. Shared voice styles are retained. Synthetic inference tests confirm ownership and exactly-once disposal; this does not establish a physical iPhone memory or latency improvement. Current unknown-memory iPhone guard remains: full generated Chris/Jessica audio is still blocked pending a genuinely smaller verified runtime/model or a free hosted synthesis resource. Removing the guard would reintroduce the reported crash risk. No paid services or alternative device voices enabled.

Reference for lifecycle semantics: https://github.com/microsoft/onnxruntime/blob/main/js/common/lib/tensor.ts . The implementation was developed with AI assistance; its deterministic synthetic tests check success and mid-denoising failure, not acoustic quality or physical touchscreen behavior.


## Sign-in and conversation availability (2026-10-22)

The login endpoint now returns the verified learner and a learningProgress snapshot together. The browser skips a second progress request when this field exists, then removes it from the account object. The separate progress endpoint still works for existing clients. No password or session rules changed.

The conversation starter buttons first open app-authored guided practice from ui/guided-conversation.ts. Its choices have meanings and references, and partner lines use existing recorded voices. This requires no AI requests. A learner can switch to open-ended AI explicitly. If the AI returns a limit or service-unavailable response, typed practice offers the labelled guided flow rather than ending at an error. Scripts do not evaluate arbitrary free text or pretend to be AI. Full reasoning and test limits: sign-in-and-always-available-practice-2026-10-22.md.

Correction, later October 22: primary conversation starters now use actual AI again; guided scripts are optional only. Both typed and voice turns share recent conversation history. Before sending history, the browser keeps only role and content: display-only reply/partner fields caused strict API validation to reject reply suggestions. A regression uses realistic UI turns against the actual request schema. See restore-ai-conversation-2026-10-22.md for evidence and free usage limits.

October 22 follow-up: generated conversation lines now prepare audio while visible, using an already-ready engine. Listen joins an identical in-flight synthesis rather than generating it twice. Reply suggestions reject exact echoes of the question and malformed responses. Session restoration returns progress alongside the verified account, removing one browser/server round trip while retaining compatibility with older API responses. See conversation-preparation-2026-10-22.md for the tradeoffs and test evidence; these changes do not guarantee instant model startup or perfect AI translations.

The browser's generated-audio cache also has an 8-MiB total budget, in addition to its six-clip count limit. Old cached audio is discarded when needed; the currently requested large audio can still play without being kept for replay. This limits retained clips, not the voice model's total memory. The change and synthetic evidence are described in conversation-preparation-2026-10-22.md.

Sign-in follow-up: session lookup no longer performs an expired-session deletion on every read; the expiry check remains in the SELECT. Session creation performs cleanup and insertion together, saving another database round trip. Render's free instance wake-up still delays requests before this code can run. See sign-in-latency-2026-10-22.md for the evidence, limits and verified Next.js security patch.

Beta regression check, October 22: live testing found the AI could repeat the learner's entire Korean message. The conversation path now rejects that exact echo before saving or reading it aloud, keeps the typed draft and offers explicit retry. This uses the existing normalized comparison also used by reply suggestions; it does not judge semantic quality or silently consume another provider request. See beta-readiness-2026-10-22.md for tests, device limits and remaining beta risks.

Chat read-aloud: the reusable playback element stays hidden; Listen and Stop audio are the controls, including another Listen tap if Safari blocks autoplay. Different synthesis jobs are serialized because the worker can generate only one line at a time. This avoids busy errors resetting the model, while keeping the same voices, generation quality settings and speaking pace. Details: chat-audio-controls-2026-10-22.md.

Bubble replay: partner message content is now a native replay button, with translation controls outside it. Novel browser-generated replies play complete sentences in sequence and prepare the next while the first plays. This can reduce the wait to the first audio; it does not make AI responses or cold model setup instantaneous. A single warmed-engine measurement and the cancellation/pace tests are documented in bubble-replay-2026-10-22.md.

Node security update (2026-10-22): both Render services pin Node 24.22.1; see docs/node-security-2026-10-22.md for the advisory, scope, and verification.

Speak playback recovery (2026-10-23): startup now releases on cancellation, timeout, and media failure; Speak can interrupt Listen. See docs/speak-card-recovery-2026-10-23.md for catalog coverage, short-word feedback, sources, and test limitations.

Beta follow-up (2026-10-23): conversation practice notes use authored guidance while dialogue stays AI-generated; voice sessions pause on page leave. Scoped Neon CLI patch overrides clear the known dependency advisories. See docs/beta-followup-2026-10-23.md for sources, tradeoffs, test evidence, and physical iPhone limitations.

Ding and conversation openings (2026-10-23): corrected missing success sounds and added gesture-time sound unlock after Stop & check. Exact prepared short openings can play while later text generates, without changing TTS pace. See docs/ding-openings-2026-10-23.md for evidence and limits.

Native practice sound recovery (2026-10-23): feedback uses a reusable native audio clip instead of a Web Audio context, with visible retry if playback is rejected. Conversation prompts request a brief meaningful first sentence; all voice speeds remain unchanged. See docs/native-practice-sounds-2026-10-23.md for measurements, implementation tradeoffs, and unconfirmed iPhone outcome.

Completed-card feedback (2026-10-23): the screenshot identified the separate Practiced · Next card action. That branch now plays the same optional sound as first-time completion without awarding progress again. See docs/beta-flow-audit-2026-10-23.md for the failing reproduction, 227-test result, browser walkthrough, deployment, and remaining beta limits.

Letter introductions (2026-10-23): lesson-questions.ts derives a short pronunciation introduction from the existing Hangul letter data. LessonModal shows it once per letter during practice, then stores the letter key in its existing seen-topics list. The Listen button uses the same recorded voices and selected pace. Quizzes skip this teaching screen. Website headings now describe the activity instead of repeating small-step slogans. See docs/letter-introductions-2026-10-23.md for sources and checks.

Beta FAQ (2026-10-23): public help now distinguishes guest browser storage from account sync and describes current voice preparation/cache limitations without the obsolete 430 MB promise. See docs/beta-faq-2026-10-23.md for evidence. Playback and storage behavior are unchanged.

Letter audio transition (2026-10-24): leaving a pronunciation introduction now runs the same audio cleanup as a question change. This prevents overlapping audio and stale busy/error state while keeping the current voices and pace. See docs/letter-audio-transition-2026-10-24.md for the reproduction and synthetic browser check.

Website analytics (2026-10-24, explicitly authorized): RootLayout loads a production-host-only Cloudflare beacon after hydration, with automatic SPA measurement off and browser privacy signals respected. It supplies no custom learner events or identifiers. The public token is not an API credential. The privacy page describes the collection; docs/web-analytics-2026-10-24.md explains metrics, limitations, tests, and removal.
# Private developer reporting

The hosted Developer section uses the existing account session plus a server-side owner-email check. The browser's developerAccess flag only controls navigation; the guarded API controls access to existing project quota totals. The report does not expose learner records or enable new event collection. See `docs/developer-section.md` for authorization, interpretation and verification details. Beta invitation edits stay on the user's device until they choose to copy or share them.
# Service checks and AI allowance

The private developer page now puts service checks and allowance ahead of traffic/history. Its health request checks the existing API/database endpoint without spending an AI request. The quota summary reads existing UTC reservation counters without increasing them. Cloudflare request handling keeps only the latest sanitized tutor/speech outcome in process memory; it never records content or raw errors. A 429 is labeled rate/quota limited rather than confirmed free-allocation exhaustion. See `docs/developer-health.md` for evidence, limits and rollback.
