# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: dynamic Next.js frontend, TypeScript NestJS backend, PostgreSQL database.

## Users

The creator is the first learner. The intended wider audience includes young people and Korean Americans who want to learn Korean. The first course assumes no Hangul knowledge; the exact primary audience segment and age range remain open.

## Product Purpose

Provide a polished Korean-learning app that remains free to use. The creator wants a launchable product that may grow to many users; no numeric success threshold is defined yet.

## Positioning

Product hypothesis: connect Hangul, vocabulary, basic grammar, listening, and guided speaking in a free beginner path, with spaced recall to help learners retain material. No market research or learning-outcome validation is on hand yet.

## Operating Context

Self-guided, mobile-first web learning. Learners can try the first lesson without an account. Progress stays in browser storage when learning without an account and can sync to the API when an account is connected.

## Capabilities and Constraints

- First-release learning scope: Hangul, vocabulary, basic grammar, speaking, and listening.
- Core lessons, review, and guided speaking must not require payment or subscription.
- The current beginner path includes six short lessons on Hangul sounds, syllable blocks, greetings, introductions, and daily words.
- Lessons mix shuffled multiple-choice and typed-recall prompts, with immediate explanations and first-try accuracy tracking.
- A searchable, categorized word bank provides Hangul, romanization, meaning, example sentences, and device speech playback.
- Review uses recall-based prompts, longer intervals after successful recall, and a shorter retry interval after a missed answer.
- Learners can practice without an account using browser storage; an optional free account syncs progress through the TypeScript API.
- Korean speech uses installed browser or operating-system voices, with a selectable voice and adjustable pace.
- User asked the assistant to select the frontend framework, TypeScript backend, and database.
- Public hosting, verified password recovery, numeric launch goals, and broader curriculum validation remain open.

## Brand Commitments

The user cited KORI as a visual reference and asked for excellent visuals. Treat KORI as inspiration for an approachable, polished feeling only; use original identity and assets. “Sori” is a provisional working name introduced during implementation, not a user-approved brand name.

## Evidence on Hand

The creator’s requirements are in chat and in `docs/superpowers/specs/2026-10-08-free-korean-learning-app-design.md`. No approved logo, illustrations, native-speaker recordings, curriculum source, user research, or market validation assets are on hand. Do not invent endorsements, adoption numbers, or validated learning outcomes.

## Product Principles

- Keep the complete beginner learning path free.
- Teach material in a sequence that moves from Hangul to useful language.
- Ask learners to recall material and revisit it over time.
- Make speaking practice possible without requiring recordings or AI.
- Treat learner identity and proficiency as separate; do not assume Korean American learners share one starting level.

## Accessibility & Inclusion

Support keyboard navigation, visible focus, readable Hangul, reduced-motion preferences, and speaking alternatives that do not require microphone permission. Do not infer proficiency from heritage or identity.
