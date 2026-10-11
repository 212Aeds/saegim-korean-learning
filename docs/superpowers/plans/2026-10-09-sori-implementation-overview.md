# Sori Implementation Plan Overview

## Approved implementation update (2026-10-09)

This update supersedes the earlier hosted-provider assumptions in the detailed plans:

- The owner set the project monthly provider cap to $0. Hosted TTS, generative Tutor, and hosted speech transcription stay disabled.
- Tutor is a standalone guided roleplay and curated grammar-help page; it is not presented as generative AI while the cap is zero.
- Lessons, Tutor, and speaking cards use browser Korean speech recognition only when on-device processing is supported. Otherwise, learners type their response. No audio is uploaded.
- Local Yuna and Eddy voices remain preferred where installed, duplicate names are removed, and hosted natural voices require a separately approved nonzero cap.
- Neon migration 004 and the audited 1,300-entry batch are applied to the linked `production` branch. Entries remain unreviewed; 8,700 more reviewed-source entries remain toward the 10,000 target.

The approved design is split into three independently reviewable plans as required for its separate content, speech, and AI subsystems:

1. [Learning content and motion](2026-10-09-sori-learning-content-and-motion.md)
2. [Natural speech and recognition](2026-10-09-sori-natural-speech-and-recognition.md)
3. [Contextual AI tutor](2026-10-09-sori-contextual-ai-tutor.md)

## Recommended order

1. Complete the card feedback and curriculum/content-integrity work first; these do not depend on an external provider.
2. Complete the speech plan's provider evaluation and shared `ProviderUsageService` foundation.
3. Build TTS/speech and tutor plans against that shared service. The tutor plan depends on the usage service contract from the speech plan.
4. Do not enable provider calls until the relevant provider, privacy terms, credentials, billing cap, and usage limits are configured; verify client fallbacks first.

## Shared constraints

- This workspace contains no Git metadata; commits and branch-based isolation are unavailable here.
- Keep Sori free to learners. Hosted services require owner-configured billing limits and API usage caps.
- No API key, recording, transcript, tutor prompt, or tutor answer belongs in a client bundle, persistent learning progress, or logs.
- No production database migrations or seed imports should be applied without confirming the target environment and migration status.
- This plan excludes automated test additions/runs; use the listed builds and manual browser acceptance checks.
