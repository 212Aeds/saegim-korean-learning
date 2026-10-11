# Sori Learning Pathways and Personalization — Design

**Status:** Awaiting user review  
**Date:** 2026-10-09

## Intent

Make Sori teach Korean more clearly and let learners choose a comfortable or more demanding pace. The first increment should improve the current curriculum and practice flows without replacing the Next.js/NestJS/Neon stack or adding paid services. Sori remains free.

## Current state

- Lessons have titles, categories, vocabulary, and generated practice questions, but no structured pre-lesson explanation for letters or grammar rules.
- Review receives the live due-card list. Rating a card updates that list while the modal is open, which can shift the current index and skip or mis-sequence cards.
- Speaking progress is recorded, but the deck’s current card index is component state. Leaving the Speak tab remounts the deck at the beginning.
- Speech uses browser/device Korean voices (`ko*`) and persists the selected voice and rate locally. The available voices and quality vary by device.
- The profile is currently a compact account row; daily goal is the main learner preference.
- Neon contains a large licensed dictionary corpus as well as the smaller hand-curated lesson vocabulary. The dictionary is useful for lookup, but is not a reviewed course curriculum.

## First increment

### 1. Teach before testing

Add an optional structured teaching briefing to each lesson. Hangul briefings explain the letter’s name, approximate sound, mouth/shape cue where useful, and a familiar example. Grammar briefings state the rule, the attachment or word-order pattern, when and where it is used, a natural example, and a common contrast or mistake. Keep the card focused: one teachable idea, one example, then practice.

The lesson flow becomes:

1. Read or listen to the short briefing.
2. Practice each taught letter or word using the existing varied prompt types.
3. Complete the existing final quiz with one question per distinct taught item and hints after answering.
4. Add eligible items to spaced review.

### 2. Broaden the pathways

Organize lessons into visible pathways with progress and prerequisite cues:

- **Hangul foundations:** consonants, vowels, syllable blocks, and batchim/final consonants.
- **Grammar in context:** sentence order, topic/subject/object markers, location particles, polite present and past forms, and common endings.
- **Everyday Korean:** useful vocabulary and short, realistic situations.
- **Stretch practice:** mixed retrieval, sentence building, and translation using completed foundation material.

Existing lessons remain available and keep their completion state. New material is unlocked by relevant prerequisites, while review remains open. Stretch practice should be challenging through mixed retrieval and production tasks, not an arbitrary timer.

### 3. Make card progression stable

Snapshot the due-card queue when a review session opens. Rating a card can update its due date and progress, but must not mutate the order or length of the current session. Reset answer inputs and phase state exactly once when advancing. In Speak, retain a stable card ID/cursor so practicing a card advances to the next uncompleted card and leaving/reopening the tab does not restart the learner’s place. Completion IDs remain de-duplicated and sync through the existing progress flow.

### 4. Improve speech controls honestly

Keep speech free and use installed Korean voices. Prefer Yuna when available; prioritize a second voice only if the device exposes it as Korean. Show a short preview action beside voice choices, persist voice and rate, and keep the current written pronunciation available. Do not select an English-only voice such as Eddy for Korean text by default; only expose it for Korean if the browser reports Korean support. The UI should explain that voice availability and naturalness depend on the device/browser, and must not label a voice “human” without evidence.

### 5. Add learner comfort preferences

Expand the account/profile area with a compact learning-preferences panel. The first controls are romanization visibility, Hangul display size, and hint level (gentle / standard / challenge). Preserve the existing daily-goal choices. Persist preferences across reloads and signed-in sessions using the current account progress sync; local-only use remains possible.

### 6. Grow vocabulary in reviewed batches

Build toward 10,000 useful Korean-English entries incrementally. The next import should be a deduplicated, provenance-preserving batch of roughly 250 high-frequency items selected for beginner/intermediate usefulness. Keep dictionary lookup separate from lesson claims until each entry has reliable gloss, pronunciation, and editorial review. Record source/license and review status, and avoid silently treating the existing raw corpus as vetted instruction.

## Implementation order

1. Add and render structured lesson briefings; introduce the first Hangul and grammar pathway lessons.
2. Stabilize Review and Speak card progression and completion persistence.
3. Add voice preview/selection improvements and profile preferences.
4. Add the next sourced vocabulary batch with deduplication and attribution.

## Acceptance criteria

- Every new alphabet or grammar lesson explains what is being learned, how it works, and a useful context/example before practice begins.
- Every lesson still ends in its item-based quiz; answer choices remain shuffled and the quiz does not depend on audio.
- Completing a review card never skips another card because the due list changed; the user sees the next card until the session is complete.
- “Practiced this card” advances to the next uncompleted speaking card, and the selected place survives tab changes and reloads.
- Speech preview plays the selected installed Korean voice at the chosen rate; unavailable choices are not presented as selectable Korean voices.
- Profile comfort choices are keyboard accessible, saved, and restored for signed-in users.
- New pathways communicate progress and unlock conditions without hiding existing completed lessons.
- New vocabulary has a source, an English gloss, pronunciation data, and an explicit review status; repeated Korean entries are not duplicated.

## Out of scope for this increment

- Replacing browser speech with a paid speech provider or generated audio archive.
- Loading 10,000 new entries in one pass.
- Replacing authentication, progress storage, or the existing app architecture.
- Claiming that every imported dictionary item has been approved by a Korean-language editor.

## Risks and mitigations

- **Voice variability:** device voices differ. Preview and capability filtering set expectations and let learners compare what is actually installed.
- **Content quality:** dictionary translations may be ambiguous. Keep source metadata and review status; introduce material in small batches.
- **Old progress compatibility:** new lesson IDs and preferences must be optional when restoring older progress JSON; preserve current completion IDs and defaults.
- **Lesson density:** explanations can overwhelm beginners. Use one rule and one example per briefing, with optional deeper notes only where needed.
