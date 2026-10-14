# Laptop-off beta: preparation and operating decision

## What can run without the laptop now

The public static build includes the Hangul letter names in Chris and Jessica voices, plus four reusable starter phrases. These are generated once with the existing local Supertonic model, packaged as WAV files, and looked up by normalized phrase and selected voice. Listening pace, Stop and end-of-playback handling use the existing playback lifecycle. No Flask, Ollama, API keys or model downloads are needed to play those files after deployment.

Regenerate missing starter files: `npm run audio:prepare` with the local speech server running. Resume is automatic; previously generated files are reused. Expand to curriculum examples: `npm run audio:prepare -- --all`. This deliberately generates only curriculum content, never private conversations. Build the laptop-independent core with `npm run build:free`. The deployable folder is `apps/web/.next-public`. It enables recorded audio and excludes localhost service URLs. The free export saves progress in the browser; account sync still requires a separately deployed API and database. Exported lesson audio is served only while the public host is available, and is not a promise of service-worker offline support.

The audio files are model-generated, not human recordings. Current Supertonic voice and model license obligations still apply when distributing generated material. Keep the existing model/license notices when packaging the site.

## Decision for live tutor, transcription and new reply audio

For no laptop operation and no personal spending, pursue sponsored GPU compute. Keep the current Qwen3:14B, Whisper medium and Supertonic stack on the sponsored host; no retraining is required. Hosted backend endpoints and authentication remain implementation work before that machine can power the public website. A grant is not approved and no free production GPU capacity has been secured.

Hugging Face documents a community GPU grant process. Its current compute-Space creation rules can require a paid account, even when CPU Basic has no hourly charge. Confirm a sponsored onboarding route with the provider before subscribing. Do not describe normal CPU Basic or ZeroGPU as unconditional free hosting for this whole stack.

Fallback: opt-in in-browser inference can avoid operator GPU bills, but needs device compatibility testing, model downloads, and a smaller/compatible model build. It is not a silent replacement for the current 14B tutor, nor is it free of power use: the learner's device supplies compute. Do not enable it automatically.

Until sponsorship is secured, publish lessons, review and recorded listening without promising always-available live AI. Existing local beta AI remains available on this laptop while it is running. This is the honest zero-spending deployment boundary.

## Sponsor inquiry brief

Saegim is a Korean-learning beta with Hangul foundations, level-aware lessons, spaced review, referenced vocabulary, and speech/conversation practice. We request donated GPU inference capacity for a limited beta, initially using Qwen3:14B and Whisper medium, plus CPU Supertonic synthesis. The current laptop runs the tutor on approximately 10 GB GPU memory; Whisper needs additional memory and concurrent capacity must be measured on the proposed host. The app does not need training compute. We can enforce participant limits, bounded requests, authentication, and per-account quotas before opening the service. Please confirm eligibility, duration, any required paid account, license requirements, data handling, and capacity limits.

This is a draft inquiry only; it has not been submitted or sent.

Sources:
- https://huggingface.co/docs/hub/spaces-gpus
- https://huggingface.co/docs/hub/spaces-overview
- https://webllm.mlc.ai/docs/user/get_started.html

Validation: 73 app tests pass; static free and signed-in production builds pass. Browser verified the hello preview enters Playing and returns to its enabled state; static serving returned the saved WAV successfully.
