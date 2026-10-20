# Beta differentiation increment

The owner approved implementing the proposed improvements while researching a distinct name. Preserve free-only providers, voices, caps, accounts and progress. No renaming or domain purchase is part of this release.

Implemented: optional bounded completed-lesson vocabulary in conversation requests, sourced only from authored lessons with IDs recorded completed; beginner/advanced policy retained; vocabulary is exposure rather than certified mastery and treated as untrusted data. No arbitrary prompt text is accepted in this field. Old requests without it remain valid. Deploy the API before the frontend. The AI is instructed to reuse vocabulary and explain unfamiliar terms; this is guidance, not a guarantee of vocabulary containment.

Conversation help provides simpler-Korean and answer-help requests, disabled while a draft is present so a draft is not overwritten. These consume the existing free allowance. Replay remains on each reply. Speech mismatch feedback explains transcript uncertainty and avoids a pronunciation judgment; score/credit behavior is unchanged. No model/provider integration, paid fallback or quota change.

The family route reuses existing referenced lessons and their existing prerequisites rather than introducing unreviewed Korean text. Goals identify what to practice, not assessed competence. Review picks the same priority/capped set then interleaves identical fronts where possible without changing due dates or ratings. Existing missed-card recovery and recall overview remain available. The landing preview becomes the primary invitation, keeping signup optional until the learner chooses a path.

Remaining release validation: actual iPhone/Android microphone and playback checks, Korean-speaker editorial review, production latency measurements across devices, and a small invited cohort. Automated tests and browser checks cannot certify pronunciation, physical-device behavior or zero bugs. Do not advertise fluency, unlimited AI or universally fast generation. No raw audio/transcripts should be added to analytics. Donation features stay off. Email preparation is separate and sending stays disabled.
