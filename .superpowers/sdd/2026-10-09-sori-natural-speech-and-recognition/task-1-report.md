# Task 1 report: Korean speech provider evaluation

**Date:** 2026-10-09

Created `docs/provider-evaluation/korean-voice-and-speech.md` with official Microsoft and Google provider links; Korean TTS/STT availability; pricing notes; Azure service-specific retention statements; the uncompleted audition/licensing gate; and fail-closed billing/application cap requirements.

The result identifies Azure Speech as a provisional single-vendor candidate only. It does not select final voices, a numeric cap, or storage. No credentials were added and no paid provider requests, tests, or builds were run.

## Reviewer fixes

Updated the evaluation to correct the Azure HD identifiers and map four exact catalog IDs to provisional Sori IDs, each marked awaiting Korean-speaker audition and not approved. Added Microsoft’s official F0/S0 quota figures (real-time STT concurrency 1/100 default; real-time TTS 20 transactions per 60 seconds / 30 TPS default), with stricter application rate/concurrency ceilings required. Explicitly marked training-use terms unresolved and a selection gate; non-retention is not treated as proof against training. The account-level hard billing stop and numeric limits remain unresolved. No credentials were added and no provider calls, tests, or builds were run.

## Commits and review

- `3afe65c` — initial provider evaluation
- `9987d80` — formatting cleanup
- `1a99719` — reviewer fixes
- Task review and scoped re-review approved; no automated tests or builds apply to this documentation task.
