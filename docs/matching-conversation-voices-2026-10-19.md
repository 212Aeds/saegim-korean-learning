# Matching conversation voices without paid synthesis

Root cause: hosted conversation replies lacked recorded catalog entries and therefore used speechSynthesis device voices. A named partner was only a label in that branch. Conversation now opts into a matching-voice path and refuses device substitution; authored recorded clips retain priority.

The optional browser engine uses the identical Supertonic 3 weights (Supertone/supertonic-3 revision 3cadd1ee6394adea1bd021217a0e650ede09a323), M1 for Chris and F1 for Jessica, 16 steps, speed 0.9, 0.25-second sentence spacing, and the recording normalization/edge padding. Model/license attribution is exposed in setup. The MIT browser helper is adapted from supertone-oss-archive/supertonic commit 1e9799e964ea4c0dad7cde993b65c3c813a7b373; ONNX Runtime Web is pinned to 1.30.0 with its MIT notice.

No model download begins without the setup action or saved setup consent. The approximately 430 MB first setup includes model files plus the selected runtime. Files come from a pinned Hugging Face snapshot, are size/SHA-256 verified, and are cached through Cache Storage where allowed. Model processing occurs in a dedicated worker with WebGPU preferred and single-thread WASM fallback. The free API handles the existing tutor/transcription only; it never receives synthesis requests from this path. No paid provider or always-on owner laptop is required.

Setup progress, cancellation, retry, resource unload, a short initial warmup, and a six-clip in-memory replay cache are included. Canceling generation terminates the worker and rejects waiting work. Voice conversation and automatic spoken replies require readiness; text chat remains available. Device performance, RAM, browser storage and WebGPU support affect availability and speed. Unsupported devices fail visibly to text rather than silently changing voices.

Real browser verification generated an uncatalogued sentence with each preset: 안녕하세요. 한국어로 같이 이야기해요. Each produced a playable 424,160-byte WAV with distinct hashes. Hosted transcription recovered the entire sentence from both saved browser-generated clips. Synthetic test accounts were removed. Physical phone microphone recording was not used. Additional tests cover consent, shared initialization, cancellation/retry, replay reuse, readiness, and model-only conversation playback without device voice enumeration.

Sources: https://github.com/supertone-oss-archive/supertonic/tree/1e9799e964ea4c0dad7cde993b65c3c813a7b373/web ; https://huggingface.co/Supertone/supertonic-3/tree/3cadd1ee6394adea1bd021217a0e650ede09a323 ; https://onnxruntime.ai/docs/tutorials/web/

Retry isolation follow-up: delayed progress and errors from a terminated worker are ignored, so canceling and restarting setup cannot let the previous attempt overwrite progress or terminate the replacement. A synthetic worker regression test reproduces the stale-event failure before the fix.
