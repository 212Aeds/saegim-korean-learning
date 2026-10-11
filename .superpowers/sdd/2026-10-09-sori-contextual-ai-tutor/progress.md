# SDD ledger — plan: docs/superpowers/plans/2026-10-09-sori-contextual-ai-tutor.md

BASE: 94c2273 (temporary isolated snapshot; original project has no Git metadata)

## Pre-flight table

| Task pair / task | Shared file or interface | Finding and ruling |
|---|---|---|
| Task 1 self-check | provider evaluation | Requires official provider terms and owner-set cap before enabling; environment placeholders only. |
| Task 2 self-check | API tutor schema/provider/controller | Request/response sizes, session auth, explicit consent, context limits, controlled errors, and no persistence are specified. |
| Task 3 self-check | client tutor panel in lesson and speaking screens | Must ignore stale answers after context changes and clear in-memory content when panel closes. |
| Tasks 1 ↔ 2 | selected provider, limits, env variables | Task 2 consumes reviewed Task 1 choice; no provider calls without configuration. |
| Tasks 1 ↔ 3 | consent/cost copy | Client copy reflects the actual selected provider's text processing, not generic assurances. |
| Tasks 2 ↔ 3 | `/v1/tutor/answer` request and `TutorAnswer` response | Task 3 consumes exact Task 2 API shape; Task 2 consumes `ProviderUsageService` created by speech plan Task 2. |

Ruling: Do not store prompts/responses or expose provider errors. Keep AI calls disabled without owner-configured budget cap and credentials; curated learning hints remain available.

Task 1 ruling: GPT-4.1 mini is a provisional implementation-fit choice, not the lowest-priced option or a Korean-quality claim. Anthropic Haiku 5.5 is currently listed at lower text token prices; compare again after Korean-speaker quality review. Tutor-specific billing and terms flags remain distinct from shared speech/audio flags. Scoped Task 1 review passed after both findings were resolved.

## Task status

- Task 1: complete — implementation `a65ac18`, review fixes `44d85f6` and `e10b627`; scoped review clean.
- Task 2: complete — implementation `8d23443`; scoped review clean. API build passed; no live provider/database action.
- Task 3: complete — implementation `eabf8b9`; scoped review clean; Webpack build passed. The reduced-motion timer finding from speech-plan final review is also resolved in the speaking-card component.

Final whole-branch review found a P2 quiz-answer leak: generated pre-answer gentle hints and the AI tutor context could include a vocabulary meaning. Commit `e0d53df` now uses a generic retrieval prompt and hides romanization/tutor help until quiz feedback appears. Scoped re-review passed; post-answer explanations remain visible.
