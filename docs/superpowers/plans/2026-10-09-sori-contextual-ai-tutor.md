# Sori Contextual AI Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Read the shared spec and this plan before changes. Complete each checkbox in order; stop at any stated external approval gate.

**Goal:** Add an optional, concise Korean-learning tutor tied to the learner's current lesson or speaking card.

**Architecture:** A Next.js panel sends an explicit-consent request to a session-authenticated NestJS endpoint. The API passes only the learner question and a bounded current lesson/card context to a selected provider, validates a structured answer, applies usage limits, and stores no conversation history.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Neon/Postgres, provider adapter selected after official documentation and cost review.

**Spec:** `docs/superpowers/specs/2026-10-09-korean-speaking-ai-learning-design.md`

## Global Constraints

- Sori remains free to learners; usage caps protect the project from unbounded provider charges.
- Show an explicit, understandable consent step before a learner's text is sent to the configured AI provider.
- Do not save tutor prompts or responses by default.
- Do not log raw learner text.
- Keep a curated lesson explanation available if the provider is not configured, over its usage cap, or unavailable.
- Keep provider secrets server-side.
- Automated tests are outside this approved work; verify changes with builds and manual browser acceptance.

## Review Focus

- Consent absent or withdrawn: send no request and keep curated lesson support available.
- Prompt or context above the configured limit: reject locally/API-side with a clear correction message.
- Provider returns malformed, overlong, or unsafe structured output: discard it and show a recoverable fallback.
- Provider times out or reaches the project cap: retain the learner's typed question locally only until panel close and show the curated hint.
- Learner navigates between lessons while the request is pending: do not apply stale advice to the newly active lesson.

---

### Task 1: Resolve tutor provider and project hard limits

**Files:**
- Create: `docs/provider-evaluation/ai-tutor.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `ProviderUsageService.allowAndRecord(accountId, "tutor")` from the natural-speech plan, and the approved project-funded and consent-gated design.
- Produces: selected model/provider, official data retention/training terms, documented Korean-learning quality constraints, provider-side monthly billing limit, and API-level daily request/token ceilings.

- [ ] Compare official provider documentation and current pricing; note prompt-retention/training policies and available billing controls.
- [ ] Require an owner-selected monthly spend cap before enabling provider calls; choose provider-side billing controls plus conservative API request/token ceilings.
- [ ] Add server-only environment variable names and placeholder values to `.env.example`; never add credentials or call an unconfigured provider.

### Task 2: Implement the bounded tutor API

**Files:**
- Create: `apps/api/src/tutor/tutor.schema.ts`
- Create: `apps/api/src/tutor/tutor-provider.ts`
- Create: `apps/api/src/tutor/tutor.service.ts`
- Create: `apps/api/src/tutor/tutor.controller.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Request: `POST /v1/tutor/answer` with `{ question: string, lessonId: string, lessonContext: string, consent: true }`; reject question over 600 chars or context over 2,000 chars.
- Response: `{ explanation: string, hint: string, nextExercise: string }`, each field plain text capped at 500 characters.
- Provider interface: `TutorProvider.answer(input: { question: string; lessonContext: string }): Promise<TutorAnswer>`.
- Usage row: daily aggregate keyed by `(account_id, feature, usage_date)` with request counts only; no prompt, response, or audio columns.

- [ ] Add schema validation for consent, lengths, provider answer shape, and answer size.
- [ ] Add authenticated controller and service; use the existing `SessionAuthGuard`.
- [ ] Call the shared `ProviderUsageService.allowAndRecord(accountId, "tutor")` before provider use and reject with a controlled usage-limit response when it returns `allowed: false`.
- [ ] Implement the selected provider behind `TutorProvider`; include bounded timeout and map provider errors to controlled HTTP responses.
- [ ] In the provider's system instruction, restrict the answer to the current Korean-learning context, treat learner text as untrusted content rather than instructions, and expose no tools or external actions.
- [ ] Do not persist request text, lesson context, response, or raw provider error in logs or database.
- [ ] Run `npm run build:api`; manually confirm consent rejection, invalid/oversized input, malformed provider answer, timeout/cap response, and normal structured answer.

### Task 3: Add the contextual tutor panel and curated fallback

**Files:**
- Create: `apps/web/app/ui/tutor-panel.tsx`
- Modify: `apps/web/app/ui/lesson-modal.tsx`
- Modify: `apps/web/app/ui/speak-deck.tsx`
- Modify: `apps/web/app/styles.css`

**Interfaces:**
- Component: `<TutorPanel lessonId={string} context={string} curatedHint={string} />`.
- Sends only `question`, active `lessonId`, a maximum 2,000-character lesson/card context, and explicit `consent: true` to `/v1/tutor/answer`.
- Displays answer, hint, next exercise, loading/error state, and the curated fallback; holds question/answer only in component memory.

- [ ] Add compact “Ask your Korean tutor” entry points in lesson and speaking-card context.
- [ ] Explain text/context processing and require a one-time affirmative consent action before the first request; provide “Not now” and a curated hint.
- [ ] Cancel or ignore stale requests after lesson/card changes and clear local question/answer state on panel close.
- [ ] Add loading, empty, provider-unavailable, usage-limit, and successful structured-answer states; preserve keyboard and screen-reader status feedback.
- [ ] Run `npm run build:web`; manually verify consent/no-request path, tutor answer path, curated fallback, panel close clearing, and stale-response handling.

## Plan Review Checklist

- Tutor is limited to current lesson/card context and has a curated fallback.
- Data sent is explicit and minimal; profile and conversation history are excluded.
- Request caps, provider-side billing limit, schema bounds, and timeouts are defined before live use.
