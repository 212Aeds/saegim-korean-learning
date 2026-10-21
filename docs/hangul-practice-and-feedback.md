# Hangul practice and feedback handoff

Added October 21, 2026.

Beginner learners can enter Build & write Hangul from Learn, or choose tiles and keyboard writing in Practice. The starter combination is ㄱ + ㅏ → 가. Additional combinations use letters explicitly covered by completed lessons or placement knowledge. Existing referenced reading examples supply the blocks; these are reading samples, not vocabulary definitions. Each finite round records normal practice activity without completing lessons or claiming mastery. Both existing voices have recorded clips for every eligible sample. Keyboard writing uses the existing Hangul keyboard; this is not handwriting recognition.

The problem-report panel opens a Google Form with the learner's explicit report, current section and an anonymous name already filled. It does not automatically submit, upload account details or conversations, access the clipboard, or download a report. The learner reviews and submits on Google. Report text is included in the URL, with a visible notice to avoid personal information.

Google's supported [prefilled form workflow](https://support.google.com/docs/answer/2839588) allows this handoff. The [Forms responses API](https://developers.google.com/workspace/forms/api/reference/rest/v1/forms.responses) exposes get/list, not response creation. Field mappings were checked with a synthetic preview; no test response was submitted. Changes to the owner's form fields require rechecking feedback-config.json.

Verification: synthetic unit fixtures cover composition, lesson exposure, voice coverage and safe form encoding. Browser checks use an isolated guest session for tile completion, wrong writing feedback, and on-screen keyboard composition. The separate feature-preview experiment remains unpublished.

## Matching listening voices

All shared Korean playback now uses the chosen Chris or Jessica voice, including ordinary Practice and guest listening. Recorded samples start directly; missing recordings use the existing browser model after automatic background preparation. A small setup panel appears for those samples, explains the approximately 430 MB first-visit download, and supports cancellation/retry. No device speech fallback or paid provider is introduced. The stale “device voice” Practice label is replaced by the selected partner name. Synthetic playback tests verify ordinary calls select the browser model and never request device voices.

## Speech reliability follow-up

Manual Stop & check can now encode a captured short word even when the endpoint detector has not yet confirmed speech (for example, speech during the initial calibration frame). Automatic silence handling still requires detected speech. The WAV encoder still rejects truly silent audio. Synthetic tests exercise both paths and double-stop cleanup. The Speak meter distinguishes connecting, ready, checking, and checked states instead of saying Microphone off after every attempt. Shared capture changes also apply to tutor voice turns; no expected answer is fed to transcription.

The reported practice target was 또. Reading practice accepts the learner-requested ddo sound cue with the standard romanization tto shown in the explanation; Hangul-building answers still require 또. 거실 tests cover spacing, punctuation and geosil while rejecting 교실 and unrelated text. These are matching tests, not a claim of measured recognizer accuracy for a real speaker.

Block audio uses /audio/blocks/{voice}-{Unicode code point}.wav for all 399 open consonant–vowel combinations. This avoids hundreds of random hash strings in the startup bundle. The audio audit requires both distinct voice files for each block, and Speak coverage is checked across all five levels. Plus-separated building prompts are spoken as the assembled block. Current practice audio is prepared ahead of taps; the builder preloads its current sample. Novel conversation remains generated on the learner's device; both voice presets are warmed during initialization. The model/preset/quality steps and all free API quotas stay unchanged.

A single live HTTP observation on October 21 measured homepage response at 0.25 seconds and API health at 32.41 seconds during wake-up. This is not a benchmark or an inference latency measurement; free hosting cold starts and browser model preparation prevent a zero-latency guarantee. No private microphone data was used for testing.
