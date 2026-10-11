# Sori Natural Speech and Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Read the shared spec and this plan before changes. Complete each checkbox in order; stop at any stated external approval gate.

**Goal:** Add a small, natural Korean audio catalog and opt-in speech transcription while keeping browser speech and typed practice available.

**Architecture:** Keep provider credentials and all media-provider calls in the NestJS API. Use stable Sori voice IDs and cached authored audio; treat speech transcription as a short-lived request that returns text only. The client never stores recordings.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Neon/Postgres, object storage/CDN selected after provider research, existing browser speech APIs as fallback.

**Spec:** `docs/superpowers/specs/2026-10-09-korean-speaking-ai-learning-design.md`

## Global Constraints

- Sori remains free to learners; usage caps protect the project from unbounded provider charges.
- Offer three or four stable, Korean-language voice choices after auditioning the available licensed provider voices for natural pacing, intelligibility, and pronunciation.
- Before first speech use, explain that a short audio clip leaves Sori for transcription. Ask for mic access only after the learner chooses to speak.
- Limit each recording to a short phrase, stop capture promptly, and discard raw audio after transcription.
- Provide a typed response path for learners who decline audio or use an unsupported browser.
- Enforce consent per feature, input and audio size/duration limits, request timeouts, and configurable per-account and project usage caps. Keep provider secrets server-side.
- Automated tests are outside this approved work; verify changes with builds and manual browser acceptance.

## Review Focus

- No Korean voice/device voice unavailable: use a clear typed/pronunciation fallback.
- Learner declines audio consent or browser denies the microphone: do not capture or upload audio.
- Unsupported browser or missing Korean language support: show typed practice, never a dead control.
- Provider timeout, quota, or misconfigured spend cap: show a recoverable message and keep lessons usable.
- Repeated or oversized recording: stop locally at the limit and prevent a second upload until the first resolves.

---

### Task 1: Select and constrain speech providers before enabling requests

**Files:**
- Create: `docs/provider-evaluation/korean-voice-and-speech.md`

**Interfaces:**
- Consumes: the approved requirement for capped project-funded TTS and transcription.
- Produces: a selected TTS/ASR provider pair; verified Korean language support; official retention/training terms; licensing for the selected 3–4 voices; storage choice; and provider-side monthly spending limit.

- [ ] Compare official provider documentation and pricing for Korean TTS and Korean speech-to-text; record quality, retention, training use, and request limits.
- [ ] Pick three or four voices only after Korean-speaker audition; record stable Sori voice IDs and provider voice identifiers.
- [ ] Choose a provider account/billing hard limit and API request caps; keep the features disabled unless both are configured.

### Task 2: Add a stable Korean audio catalog

**Files:**
- Create: `apps/api/src/audio/audio-provider.ts`
- Create: `apps/api/src/audio/audio-catalog.service.ts`
- Create: `apps/api/src/audio/audio.controller.ts`
- Create: `apps/api/src/audio/audio-storage.ts`
- Create: `apps/api/src/generate-audio.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`
- Create: `apps/api/db/007-audio-assets.sql`
- Create: `apps/api/src/provider-usage.service.ts`
- Create: `apps/api/db/006-provider-usage.sql`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts` only if upload/body limits need an API-level adjustment.
- Modify: `apps/web/app/ui/speech.ts`
- Modify: `apps/web/app/ui/speak-deck.tsx`
- Modify: `apps/web/app/styles.css`

**Interfaces:**
- Produces: `KoreanAudioProvider.synthesize(text: string, providerVoiceId: string): Promise<{ bytes: Uint8Array; contentType: string }>`.
- Produces: `ProviderUsageService.allowAndRecord(accountId: string, feature: "tutor" | "transcription"): Promise<{ allowed: boolean; reason?: "account-limit" | "project-limit" }>` for later API tasks; it fails closed if limits are missing.
- Produces: `AudioStorage.put(key: string, bytes: Uint8Array, contentType: string): Promise<void>` and `AudioStorage.read(key: string): Promise<{ bytes: Uint8Array; contentType: string }>`.
- Produces: `GET /v1/audio/voices` returning the configured, stable `{ id, label, locale: "ko-KR", sampleAssetId }[]` catalog.
- Produces: `GET /v1/audio/:assetId` serving a cached reviewed asset to an authenticated learner.
- Produces: client `playKorean(text, { voiceId, rate })` that prefers the catalog and falls back to a labeled device voice.

- [ ] Create daily provider request counts keyed by `(account_id, feature, usage_date)`; implement `ProviderUsageService.allowAndRecord` to enforce configured project and per-account limits before tutor or transcription calls, and fail closed if a limit is unset.
- [ ] Add `PROVIDER_DAILY_LIMIT`, `PROVIDER_ACCOUNT_DAILY_LIMIT`, provider credentials, storage credentials, and selected voice IDs to `.env.example` as placeholder names only; fail closed until limits and credentials are set.
- [ ] Create audio metadata table with unique `(content_key, voice_id, model_version)`, storage key, license, checksum, and reviewed status.
- [ ] Implement the configured object-storage adapter and `audio:generate` manifest command; generate only reviewed authored content and rely on the configured provider-side billing cap.
- [ ] Implement the provider adapter only for the selected provider; never return credentials or raw provider errors to the client.
- [ ] Generate/cache authored lesson and highest-use reviewed vocabulary clips first; do not bulk-generate the 10,000-word target.
- [ ] Expose no more than four reviewed Korean voices, with preview, replay, pace control, loading/error states, and device-TTS fallback.
- [ ] Run `npm run build:api` and `npm run build:web`; manually confirm each voice plays, fallback works, and an absent provider disables catalog audio without breaking lessons.

### Task 3: Add explicit, short-lived Korean speech transcription

**Files:**
- Create: `apps/api/src/speech/speech-provider.ts`
- Create: `apps/api/src/speech/speech.controller.ts`
- Create: `apps/web/app/ui/speech-practice.tsx`
- Modify: `apps/web/app/ui/speak-deck.tsx`
- Modify: `apps/web/app/styles.css`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces: `KoreanSpeechProvider.transcribe(audio: Uint8Array, contentType: string, locale: "ko-KR"): Promise<{ transcript: string }>`.
- Produces: authenticated `POST /v1/speech/transcribe` accepting one consented audio clip up to 15 seconds and 2 MB, returning `{ transcript: string }` only.
- Produces: `SpeechPractice` states `ready | requesting | listening | transcribing | result | error`; callback returns a transcript for ephemeral comparison with the target phrase.

- [ ] Add server validation for session, explicit consent, MIME type, 15-second maximum, and 2 MB maximum before contacting the provider.
- [ ] Configure no raw-audio/transcript logging; discard request bytes after the provider returns and return only the transcript.
- [ ] Request browser microphone permission only after the learner starts; include visible listening state, stop/cancel, and typed alternative.
- [ ] Add a “Clear transcript” action that clears in-memory transcript state immediately and sends nothing to storage.
- [ ] Compare normalized Hangul text against the target phrase and use “match/try again” feedback; do not report accent or pronunciation scores.
- [ ] Run `npm run build:api` and `npm run build:web`; manually verify consent decline, microphone denial, unsupported browser, provider failure, successful transcription, and typed fallback.

## Plan Review Checklist

- Provider names, costs, data terms, and final voice quality are not invented; Task 1 gates all paid service calls.
- Audio metadata is separate from Postgres word rows; raw learner recordings and transcripts are not persisted.
- Voice fallback and typed practice keep learning usable when browser or provider support is missing.
