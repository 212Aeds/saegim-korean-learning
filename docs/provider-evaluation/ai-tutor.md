# AI tutor provider evaluation

**Review date:** 2026-10-09  
**Decision:** Provisional implementation candidate: OpenAI API, GPT-4.1 mini, using Chat Completions with a strict structured response schema. This is an implementation-fit choice, not a claim that it is the cheapest or best Korean tutor. Korean-learning accuracy and tone still need review by a qualified Korean speaker before launch.

## Why this candidate

The tutor needs short text input and a compact, predictable answer. GPT-4.1 mini supports text and structured outputs, allowing the API to require an explanation, hint, and next exercise rather than accept free-form application state. The model supports Chat Completions. The listed standard text price on the review date is **$0.40 per million input tokens and $1.60 per million output tokens**. Prices can change; recheck the official model page before enabling the provider.

### Alternative considered: Anthropic Claude Haiku 4.5

Anthropic's current pricing page lists Claude Haiku 4.5 at **$1 per million input tokens and $5 per million output tokens**. The page also lists the newer Claude Haiku 5.5 at **$0.10 per million input tokens and $0.50 per million output tokens for prompts up to 100,000 tokens**, making it cheaper than GPT-4.1 mini at the listed rates. Anthropic's commercial API policy says chats are not used for model training unless the customer opts into the Development Partner Program, and inputs/outputs are ordinarily deleted within 30 days, with stated exceptions for policy violations, legal obligations, and customer-controlled longer-retention services.

GPT-4.1 mini remains the provisional implementation choice because its current official documentation directly supports the planned Chat Completions plus strict structured-output contract, and its data-control behavior is documented for the intended endpoint. This is not a price advantage: Haiku 5.5 is cheaper at listed rates and may merit selection after comparing integration and contractual settings. No Korean quality comparison has been performed for either model; both require Korean-learning quality review and review of applicable provider terms before launch. Keep the selection provisional until that review is done.

Use a server-side adapter, strict JSON schema, a short output limit, and no tools or external actions. Send only the learner's question and the current lesson/card context after explicit consent. Do not send profile data or prior conversation history. Set `store: false`; do not enable audio or conversation-state features for this tutor.

## Data handling

OpenAI's API data controls page says API data is not used to train models by default. For Chat Completions, it lists no application-state retention for text-only requests, while default abuse-monitoring logs may retain prompts and responses for up to 30 days. That means “not used for training” does not mean “not retained.” Sori should keep its own logs and database free of raw learner questions, context, answers, and provider error bodies. A learner must affirm the text-processing consent before a request is sent.

The selected account/project settings and applicable terms still need an owner review before use. Do not claim zero retention or training exclusions beyond what the configured account and current provider terms actually support.

## Project cost controls

Configure an owner-selected **monthly project hard spend limit** in OpenAI's API platform before enabling calls. A spend alert alone is not a hard cap. OpenAI documents that reaching a project or organization hard limit causes affected API requests to fail with `429`, but enforcement is not instantaneous and recorded spend may slightly exceed the configured limit. This is a meaningful external stop, not an exact dollar guarantee.

Sori must also enforce positive application-side ceilings for both the project and each account: daily request counts and daily token budgets. The values are intentionally unset in `.env.example`; the project owner must choose them. Reserve a bounded worst-case token allowance before each provider request so concurrent requests cannot evade a token ceiling. Missing, malformed, zero, or negative values must disable tutor calls. Existing shared provider billing and terms review flags must also be affirmatively set.

## Enablement gates

Keep tutor calls unavailable unless every condition is met:

1. The owner configures and verifies a positive monthly project hard spend limit in the provider account.
2. The owner reviews current provider terms and data controls for the actual account and use case.
3. A server-side API key is configured; it is never sent to the client or logged.
4. `TUTOR_PROVIDER_ENABLED` is explicitly enabled, the provider and model match the server's allowlist, and positive project/account daily request and token ceilings are configured.
5. Sori's shared billing-cap and terms-review flags are affirmatively enabled.
6. The learner provides explicit consent for the question and relevant lesson/card context to leave Sori for processing.

`TUTOR_BILLING_CAP_CONFIRMED` and `TUTOR_TERMS_REVIEWED` are tutor-specific affirmative gates. Shared flags used by other provider features do not authorize OpenAI tutor calls. If any gate is absent, the curated lesson hint remains available and no provider request is made. Do not set a budget amount without the owner's decision.

## Official sources

- [GPT-4.1 mini model details and pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini) — reviewed 2026-10-09; standard text input/output prices shown above.
- [Data controls](https://developers.openai.com/api/docs/guides/your-data) — training, abuse-monitoring retention, and application-state behavior.
- [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits) — hard-limit configuration, 429 behavior, and possible overage during enforcement.
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — schema-constrained outputs.
- [Anthropic model pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Haiku 4.5 and current Haiku 5.5 comparison prices; reviewed 2026-10-09.
- [Anthropic commercial API data retention](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data) — 30-day default deletion timeframe and exceptions.
- [Anthropic commercial API training policy](https://privacy.anthropic.com/en/articles/7996885-how-do-you-use-personal-data-in-model-training) — no training unless the customer opts into the Development Partner Program or explicitly supplies feedback/materials.
