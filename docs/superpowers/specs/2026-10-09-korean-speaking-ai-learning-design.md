# Sori: Natural Speech and Deeper Korean Practice

**Status:** Approved direction; implementation in progress  
**Date:** 2026-10-09  
**Decision:** Keep Sori free to learners and hold the project-funded provider cap at $0/month. Use on-device Korean speech recognition where supported, guided Tutor content, and local system voices. Do not send learner audio or questions to cloud providers.

## 1. Intent and success

Sori should help curious learners build Korean that they can recognize, understand, and say. This change makes the existing lesson and speaking experience more responsive, improves curriculum depth, and adds opt-in tutor and speech practice without introducing learner subscriptions.

Success means:

- Learners can use Yuna and Eddy where installed, audition distinct local Korean voices, and adjust speaking speed. Voice quality depends on the device engine; Sori does not claim it can turn a system voice into a human recording.
- Learners can practice real-life situations and get curated grammar help on a standalone Tutor page, with on-device speech recognition where available and typed alternatives everywhere.
- Existing practice stays usable without AI, audio, or a microphone.
- Vocabulary grows toward 10,000 distinct, traceable entries in quality-reviewed batches; dictionary size alone does not unlock words for lessons.
- Card completion and navigation give immediate, accessible feedback.

## 2. Current state

- The web app is Next.js; the API is NestJS with Neon/Postgres.
- TTS uses `SpeechSynthesis` voices installed on the learner's device. Yuna/Eddy remain preferred names when present; duplicate name/locale choices are removed.
- Hosted AI, speech transcription, and provider audio remain disabled at the $0 monthly cap. Tutor is standalone guided practice with curated answers.
- The curriculum contains 36 lessons.
- The speaking deck already contains 100 cards, generated from 25 phrases in four practice modes.
- Neon now contains 1,300 imported headwords, each with a stable ID and unreviewed status. Another 8,700 reviewed-source entries are needed to reach 10,000.
- Card completion already shows a brief practiced state before advancing.

## 3. Learner experience

### 3.1 Voice selection and playback

Offer Yuna and Eddy plus distinct Korean voices already installed on the device, removing duplicate voice names. Prefer local voices and make preview and speaking speed available. Label them as device voices because availability and quality vary by operating system. Hosted natural TTS is not enabled while the project cap is $0; changing the cap requires a separate owner decision and provider review.

### 3.2 Tutor

Make Tutor a standalone navigation page for learners who want roleplay or Korean answers. Include everyday scenarios, useful phrases, grammar notes, and authored grammar Q&A. Tutor remains guided and curated while the provider cap is $0; do not represent it as generative AI. Keep it separate from lesson/card completion so it does not remount when a card changes.

### 3.3 Speech practice

Offer speech practice in lessons, Tutor, and speaking cards. Require browser on-device processing (`processLocally`) for Korean recognition; fail closed if unsupported. Request microphone permission only after the learner starts. Show listening, transcript, denied, unsupported, and language-pack-unavailable states. Provide typed practice everywhere. Compare recognized text with the target phrase; do not claim to measure accent or pronunciation quality.

### 3.4 Card feedback and motion

When a learner selects “I practiced this card,” show a checked “Practiced” state, a subtle success animation, and a progress pulse before advancing after about 400 ms. Prevent double completion during that interval. Use short opacity/position transitions when revealing or changing cards. Respect `prefers-reduced-motion` with immediate state changes and no decorative movement.

### 3.5 Curriculum and words

First complete briefings and missing examples for the existing lessons. New lessons follow the established pathway sequence and explain the rule, sound or pattern, when it is used, and a natural example. Add authored recall, recognition, and writing practice where generic questions are weak. Lessons remain separate from the searchable dictionary.

Grow the searchable dictionary toward 10,000 distinct entries in reviewed batches. Each imported entry must have a stable source-aware ID, Korean headword, gloss, category or part of speech, source and license metadata, and review status. Keep required attribution and share-alike obligations with CC BY-SA data. Do not promote unreviewed entries to curriculum, generated quizzes, or spaced-repetition queues.

## 4. Technical design

### Web client

- Keep lesson, card, and profile flows in the existing Next.js app.
- Add small components for the standalone guided Tutor and on-device speaking practice, with explicit unsupported/error states.
- Keep transcripts in component memory only; do not send audio or tutor text to providers, store transcripts in local storage, or sync them as progress.
- Use CSS transitions and existing reduced-motion support; do not add an animation dependency for these interactions.

### NestJS API

Provider endpoints remain in the codebase but must fail closed while the monthly project cap is zero. Any future enablement requires fresh owner approval and provider review:

- `TutorProvider`: receives a validated prompt and minimal lesson context; returns a bounded, structured explanation, hint, and exercise.
- `SpeechProvider`: receives a short, consented audio upload and returns a transcript; it does not retain the recording.
- `KoreanAudioCatalog`: maps stable Sori voice IDs and reviewed authored text to cached audio assets.

Provider endpoints must remain unavailable at a missing or zero monthly cap, even if older daily limits are set. This release uses local device speech, on-device recognition, curated Tutor content, and typed practice.

When providers are absent or disabled, lessons, device voices, the guided Tutor, and typed practice stay available.

### Data and audio assets

- Store reviewed dictionary entries in Postgres and expose paginated search rather than shipping a 10,000-word corpus in the web bundle.
- Preserve IDs already in use. Namespaced source IDs and sense/POS disambiguation apply to new imports.
- Add or use source, license, review-status, and stable-ID fields through an explicit migration before import. Seed imports must be idempotent.
- Store audio files in object storage/CDN, not Postgres rows. The catalog records the stable phrase/voice/model version and asset key; generated files are immutable and reusable.
- Do not persist audio recordings, transcripts, or tutor conversations in the learning-progress tables.

## 5. Usage, privacy, and reliability

- Sori remains free for learners and the current project monthly provider cap is $0.
- Speech recognition must explicitly require on-device Korean processing; do not fall back to a browser mode that could send audio remotely.
- Give learners typed alternatives and clear in-progress speech content when the component closes.
- Use provider-neutral adapters so voice, AI, or transcription services can be changed without rewriting the lesson UI.
- No external provider or model is enabled. Selection requires comparing Korean quality, retention/training terms, and costs after an owner-approved nonzero monthly cap.

## 6. Delivery sequence

1. **Practice polish and content integrity:** retain card feedback and curriculum work; strengthen authored quiz coverage.
2. **Local speech and Tutor:** add fail-closed on-device recognition with typed fallback and move roleplay/help to a standalone Tutor page.
3. **Free voice experience:** deduplicate local Korean voices, preserve Yuna/Eddy, and let learners preview voice and pace. Hosted voices require a separately approved nonzero cap.
4. **Vocabulary scale and new lessons:** import audited batches toward 10,000 entries; add lessons tied to reviewed vocabulary and current pathway prerequisites.

## 7. Acceptance criteria

- Tutor has a standalone navigation destination and does not remount with lessons or speaking cards.
- Speech recognition requests local Korean processing only; unsupported browsers offer typed answers and never upload audio.
- Audio is not uploaded or stored by Sori; unsupported local recognition fails closed and leaves typed practice available.
- A missing or zero monthly provider cap disables hosted Tutor, transcription, and audio catalog routes even if legacy daily-limit flags remain configured.
- Card completion visibly registers once before it advances; reduced-motion preference removes the animation without hiding state feedback.
- Dictionary imports are source-attributed, deduplicated, review-labeled, and idempotent; unreviewed entries do not feed lessons or review queues.
- New lessons include a clear explanation, natural usage context, examples, prerequisite links, and purposeful recall/recognition/writing activities.

## 8. Open decisions

1. The current provider cap is $0. A project owner must explicitly choose a nonzero monthly amount before hosted natural TTS or generative AI can be enabled.
2. Which licensed bilingual datasets can expand the lexicon beyond reviewed batches without weakening translation quality or attribution?
3. Which device voices sound best across supported operating systems? Voice names and quality are device-dependent.

## 9. Self-review

- Sori remains free to learners and the active provider cap is $0.
- Hosted voice quality is not promised; learners use Korean voices installed on their device.
- Speech recognition requires local Korean processing and keeps a typed fallback.
- The 10,000-word target is staged and quality-gated; current unreviewed material is not treated as lesson-ready content.
- The existing 100 speaking cards are recognized, and additions focus on better feedback and speech practice rather than inflating card count.
