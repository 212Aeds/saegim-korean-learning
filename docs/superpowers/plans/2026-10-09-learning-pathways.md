# Learning Pathways and Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sori’s lessons teach Korean explicitly, progress reliably through review and speaking cards, and let learners personalize a free course that can grow toward 10,000 useful words.

**Architecture:** Keep the existing Next.js client, NestJS API, and Neon progress/content store. Add typed teaching/pathway metadata to the current curriculum, keep each review session’s queue stable, persist the speaking cursor and comfort preferences in the existing progress document, and import vocabulary in attributed, deduplicated batches.

**Tech Stack:** Next.js 16, React, TypeScript, NestJS, PostgreSQL on Neon, browser SpeechSynthesis.

**Spec:** `docs/superpowers/specs/2026-10-09-learning-pathways-design.md`

## Global Constraints

- Sori remains free; do not add subscription gates or paid speech services.
- Keep the existing Next.js/NestJS/Neon stack, account flow, and progress format backward-compatible.
- Use installed Korean voices only for Korean playback; voice availability and sound quality are device-dependent.
- Introduce vocabulary in attributed, deduplicated batches; do not present unreviewed dictionary records as curated lessons.
- Keep lessons focused on one explainable idea and preserve item-based practice and final quizzes.
- Do not add or run tests unless the user asks; verify changed packages with production builds and focused manual checks.

## Review Focus

- Existing progress JSON has no cursor or preference fields; restoration must retain defaults and existing completion state.
- Rating a review item changes its due date; the active session must keep its initial order and membership.
- A missing or stale speaking-card cursor must resolve to the next uncompleted card, then a safe first card when all are complete.
- A device may expose no Korean voice, or may expose a similarly named non-Korean voice; playback must not silently select English speech.
- A lesson prerequisite may refer to an unknown ID; existing lessons must remain accessible and no learner should be locked out by bad metadata.

---

## File map

- `apps/web/app/curriculum.ts` — lesson and question types, existing lesson metadata.
- `apps/web/app/more-lessons.ts` — additional Hangul/grammar lessons and vocabulary entries.
- `apps/web/app/learning-pathways.ts` — new pathway definitions and lesson group metadata.
- `apps/web/app/ui/lesson-modal.tsx` — briefing, practice, and quiz flow.
- `apps/web/app/ui/review-modal.tsx` — stable per-session review queue.
- `apps/web/app/ui/speak-deck.tsx` and `apps/web/app/ui/speech.ts` — card cursor, voice priority, voice preview.
- `apps/web/app/progress.ts` and `apps/web/app/page.tsx` — backward-compatible learner preferences/cursor and profile wiring.
- `apps/web/app/styles.css` — lesson/pathway/profile layouts and preference styles.
- `apps/api/db/seeds/curated-vocabulary.json` — the next reference batch with source and editorial-review metadata.
- `apps/api/db/004-vocabulary-review-metadata.sql` — add explicit source-license and editorial-review fields to dictionary entries.
- `apps/api/db/005-progress-personalization.sql` — persist speaking cursor and learning preferences for signed-in accounts.
- `apps/api/src/progress.schema.ts` and `apps/api/src/auth.controller.ts` — validate, read, and write the additional progress fields.
- `apps/api/src/seed-words.ts` — idempotent vocabulary upsert and duplicate handling.
- `apps/api/db/seeds/ATTRIBUTION.md` — add the new batch’s source/license notes.
- `apps/web/app/reference-vocabulary.ts` — provide a local CC-KeDict reference fallback for offline dictionary lookup.
- `apps/web/app/page.tsx` — expose reference lookup without adding unreviewed content to lessons.

### Task 1: Structured teaching briefings and pathways

**Files:**
- Modify: `apps/web/app/curriculum.ts`
- Modify: `apps/web/app/more-lessons.ts`
- Create: `apps/web/app/learning-pathways.ts`
- Modify: `apps/web/app/ui/lesson-modal.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/styles.css`

**Interfaces:**
- Add `LessonBriefing = { focus: string; explanation: string; useWhen: string; example: string; translation: string; watchFor?: string }`.
- Extend `Lesson` with optional `briefing`, `pathwayId`, `level`, and `prerequisiteLessonIds` so old records keep working.
- Export pathway records with stable IDs `hangul`, `grammar`, `everyday`, and `stretch`; stretch practice can use only completed foundation material.

- [x] Add the typed briefing and optional lesson pathway metadata; leave current lesson records valid without edits to unrelated content.
- [x] Add lesson briefings and first-pathway content for consonants, vowels, syllable blocks, batchim, sentence order, particles, and polite present tense. Each briefing must state a usable rule, a context, and a Korean example with English translation.
- [x] Render briefing as the lesson’s first phase, then keep the existing varied practice and one-question-per-item final quiz transitions.
- [x] Group lessons by pathway, show progress/prerequisite status, and leave already-completed lessons accessible.
- [x] Run `npm run build:web`; expected: exit code 0 with existing routes built.
- [ ] Manually open Hangul and grammar lessons; confirm briefing → practice → final quiz → completion, and confirm old saved progress still unlocks old lessons.

### Task 2: Stable review sessions and resumable speaking cards

**Files:**
- Modify: `apps/web/app/ui/review-modal.tsx`
- Modify: `apps/web/app/ui/speak-deck.tsx`
- Modify: `apps/web/app/progress.ts`
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Extend `SavedProgress` with `speakingCardId: string | null`; default to `null` when restoring older progress.
- Update `SpeakDeck` to accept `currentCardId: string | null` and `onNavigate(cardId: string): void`; update completion callback to `onComplete(completedId: string, nextCardId: string): void`.
- Resolve invalid cursors to the earliest uncompleted speaking card, falling back to the first card when all are complete.

- [x] Snapshot `items` once when `ReviewModal` mounts and use the snapshot for card count, choices, index, and next-card decisions; continue calling `onRate` for each completed item.
- [x] Replace the speaking deck’s index-only cursor with stable card-ID navigation; on practice, advance to the next uncompleted card and persist that ID through parent progress.
- [x] Normalize missing, invalid, or completed cursors without changing existing speaking completion IDs.
- [x] Run `npm run build:web`; expected: exit code 0.
- [ ] Manually review multiple due cards while each rating changes its due date; confirm no cards are skipped and the session ends after the original queue. Practice a speaking card, switch tabs, return, and reload; confirm the next uncompleted card is selected.

### Task 3: Voice preview and learner comfort profile

**Files:**
- Modify: `apps/web/app/ui/speech.ts`
- Modify: `apps/web/app/ui/speak-deck.tsx`
- Modify: `apps/web/app/progress.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/ui/account-modal.tsx`
- Modify: `apps/web/app/ui/lesson-modal.tsx`
- Modify: `apps/web/app/styles.css`

**Interfaces:**
- Add `LearningPreferences = { romanization: boolean; hangulSize: "standard" | "large"; hintLevel: "gentle" | "standard" | "challenge" }` to saved progress, with defaults `true`, `standard`, and `standard`.
- Expose a `previewKoreanVoice(text: string, voiceURI: string, rate: number): boolean` helper using the same selection path as normal playback.
- Voice choices remain filtered to `lang` values beginning with `ko`; prefer Yuna when available and otherwise retain a selectable device-provided Korean voice.

- [x] Adjust voice sorting to prefer Yuna and Eddy when the device offers Korean voices, then other voices explicitly marked natural/enhanced/premium, without overriding the learner’s persisted choice.
- [x] Add a voice-preview control and ensure the selected voice and rate apply to playback.
- [x] Add profile controls for romanization visibility, Hangul size, and hint level; persist them with progress and restore defaults for existing accounts.
- [x] Apply romanization and Hangul-size settings to lesson/speaking content; apply hint level to hint reveal/detail without removing the required final quiz.
- [x] Run API and web production builds; expected: exit code 0.
- [ ] Manually change each setting, reload, and confirm it persists. When Korean voices are available, preview Yuna/another Korean voice; with no Korean voices, show the existing written pronunciation and no English voice option.

### Task 4: Attributed, deduplicated vocabulary batch

**Files:**
- Create: `apps/api/db/004-vocabulary-review-metadata.sql`
- Create: `apps/api/db/seeds/curated-vocabulary.json`
- Modify: `apps/api/src/seed-words.ts`
- Modify: `apps/api/db/seeds/ATTRIBUTION.md`
- Create: `apps/web/app/reference-vocabulary.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/word-bank.ts`

**Interfaces:**
- Each new row must include a stable ID, Korean headword, romanization, English gloss, category, example, source, license, and `reviewStatus`.
- Migration `004-vocabulary-review-metadata.sql` adds `source_license` and `review_status` with backward-compatible defaults to `korean_words`.
- Seed ingestion must be idempotent by stable ID and Korean headword; a repeat import must not increase row count or overwrite a curated record with lower review status.

- [x] Add a roughly 250-entry beginner/intermediate batch selected for common usefulness, with source and review metadata on every entry.
- [x] Add migration `004-vocabulary-review-metadata.sql` for the dictionary review metadata.
- [ ] Apply migrations `004` and `005` and run the seed twice on a Neon development branch only. (Pending: Neon’s account service is unavailable; production was not changed.)
- [x] Add an idempotent seed path with Korean-headword deduplication and preserve existing records with stronger editorial status.
- [x] Keep unreviewed rows in reference lookup only, including the offline fallback; no entries from this batch have Korean-fluent editorial approval for lesson use yet.
- [x] Document source and license terms in `ATTRIBUTION.md`.
- [x] Run API and web production builds; expected: both exit code 0.
- [ ] Manually run the seed against the isolated development branch twice; confirm counts stay stable, records retain metadata, and the word bank returns the new entries.

## Execution notes

- The workspace currently has no Git metadata, so per-task commits and isolated worktrees are unavailable unless the project is initialized in Git.
- Database migration and import work must use a separate Neon development branch; production remains untouched. Migrations and seed are ready but have not been applied because Neon’s account service is unavailable.
- The implementation follows the four tasks in order; each task is useful on its own and keeps older progress readable.
- Council review lenses for implementation are Korean-teaching accuracy, card-state reliability, accessibility and comfort, and free-tier sustainability.
