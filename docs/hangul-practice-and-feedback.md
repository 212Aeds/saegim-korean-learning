# Hangul practice and feedback handoff

Added October 21, 2026.

Beginner learners can enter Build & write Hangul from Learn, or choose tiles and keyboard writing in Practice. The starter combination is ㄱ + ㅏ → 가. Additional combinations use letters explicitly covered by completed lessons or placement knowledge. Existing referenced reading examples supply the blocks; these are reading samples, not vocabulary definitions. Each finite round records normal practice activity without completing lessons or claiming mastery. Both existing voices have recorded clips for every eligible sample. Keyboard writing uses the existing Hangul keyboard; this is not handwriting recognition.

The problem-report panel opens a Google Form with the learner's explicit report, current section and an anonymous name already filled. It does not automatically submit, upload account details or conversations, access the clipboard, or download a report. The learner reviews and submits on Google. Report text is included in the URL, with a visible notice to avoid personal information.

Google's supported [prefilled form workflow](https://support.google.com/docs/answer/2839588) allows this handoff. The [Forms responses API](https://developers.google.com/workspace/forms/api/reference/rest/v1/forms.responses) exposes get/list, not response creation. Field mappings were checked with a synthetic preview; no test response was submitted. Changes to the owner's form fields require rechecking feedback-config.json.

Verification: synthetic unit fixtures cover composition, lesson exposure, voice coverage and safe form encoding. Browser checks use an isolated guest session for tile completion, wrong writing feedback, and on-screen keyboard composition. The separate feature-preview experiment remains unpublished.

## Matching listening voices

All shared Korean playback now uses the chosen Chris or Jessica voice, including ordinary Practice and guest listening. Recorded samples start directly; missing recordings use the existing browser model after explicit voice setup. A small setup panel appears for those samples, explains the optional approximately 430 MB download, and supports cancellation/retry. No device speech fallback or paid provider is introduced. The stale “device voice” Practice label is replaced by the selected partner name. Synthetic playback tests verify ordinary calls select the browser model and never request device voices.
