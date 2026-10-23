# Practice ding and prepared conversation openings — 2026-10-23

AI-assisted follow-up to the learner's successful iPhone Safari report. Preserve every TTS rate, voice preset, model setting, account, usage cap, and free-only setting.

## Correct-answer audio

Fixed missing standalone guest writing dings (callbacks still own the sound in lessons, avoiding duplicates). A correct spoken retry now plays the ding even after an earlier wrong attempt, while first-attempt scoring remains guarded. Stop & check unlocks the feedback AudioContext again from its tap after releasing capture, to help Safari resume it before the asynchronous transcript returns.

Audited existing correct-result wiring in lessons, mixed practice, Hangul building, review recall, Speak, and landing samples. AI conversation is not graded and does not receive an invented success ding.

Unit test verifies interrupted AudioContext resume, the two-tone ding, and muting. Browser fixture with real Web Audio and synthetic typed answers: wrong nami produced zero tones; correct namu produced two tones (one ding); muting and submitting correctly again left the count at two. No warning/error logs. This was a desktop browser check, not an additional physical iPhone test.

## Conversation audio start

Short openings were merged into the following sentence even if a named recording could play immediately. Splitting now preserves an exactly recorded short opening, starts it from the catalog, and prepares the following sentence during playback. Prefetch uses the same voice-aware segmentation as playback. It never inserts an opening that the AI did not say and never changes the reply text.

Added eight free locally generated clips: Chris/Jessica for 좋아요!, 안녕하세요!, 네, 좋아요., 그렇군요. Same existing Supertonic M1/F1 presets, recording quality 16 steps, base speed 0.9, no model download or paid request. Playback retains the learner's selected rate. Novel openings still use the previous generation path; full reply latency and inter-sentence gaps are not eliminated. No universal milliseconds or physical-device speed improvement claimed.

Regression test proves the catalog opening's play call occurs before new synthesis and the selected 0.9 playback rate is retained on both parts. Existing sentence completion/cancellation tests pass. Audio audit: 1,878 verified clips, including 798 blocks; new clips add about 1.4 MiB total across both voices.

## Verification

223 local tests passed, including four existing untracked preview tests that are not published. Hosted build passed; no API code changed. Deployment pending. Test fixtures, logs, local models, and previews remain unpublished.

Rollback: revert this frontend patch, its manifest entries, and eight clips; retain Node 24.22.1 and the previous security fixes. No database changes.
