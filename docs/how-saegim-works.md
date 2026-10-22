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
