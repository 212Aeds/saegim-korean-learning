# Full website and AI hosting: current decision

Updated 15 October 2026. No hosting account or GPU allocation is connected yet. Nothing in this document means a cloud service is running.

| Component | Hosting setup | Current state |
| --- | --- | --- |
| Website and recorded audio | Render static site in `render.yaml` | Configured in code; account and repository connection needed |
| Login and progress API | Render Free Node service in `render.yaml` | Configured in code; Neon secret and final website origin needed |
| Database | Existing Neon project | Already used by the local app; no new database required |
| Qwen tutor | Sponsored GPU host for current Ollama service, or an adapted Hugging Face ZeroGPU Gradio service | Neither compute nor a tested adapter is provisioned |
| Whisper transcription | Same sponsored compute, or an adapted ZeroGPU service | Neither compute nor a tested adapter is provisioned |
| Chris/Jessica synthesis | Existing Supertonic service on a suitable host | Not publicly hosted; existing 162 recorded clips ship with the website |

## Selected next steps

1. Finish Render signup and connect the repository. Deploy the two resources in `render.yaml` only on the free options. The branch must first be pushed to GitHub. Keep paid flags disabled.
2. Verify the website and API URLs, then connect account sessions using the same-origin proxy or same-site custom domains described in `hosted-api.md`. The static free build deliberately uses device-only progress until this is tested.
3. Check whether the owner already has a verified Hugging Face account older than 30 days. Eligible free personal accounts can host up to two ZeroGPU Gradio Spaces. If eligible, build and test a Gradio adapter for Qwen and Whisper before enabling the public tutor. ZeroGPU does not directly run the existing Ollama/Flask deployment.
4. If not eligible, a new account cannot immediately host free ZeroGPU. Sponsored GPU capacity is the way to preserve the current models without personal spending. A sponsorship request has not been sent. Buying a plan or relying on trial credits is not authorized by this setup.

## Limits that affect the design

Render Free has 512 MB RAM and spins down after 15 idle minutes. It can serve the small API but cannot fit the model stack. Do not put model downloads in the API build.

ZeroGPU currently offers 5 GPU minutes/day for a free authenticated caller, or 2 minutes for an anonymous caller. An API that forwards all users under one owner token would share that caller quota; it is not free unlimited capacity for all learners. Published API use, queue behavior, privacy, model licensing, and token forwarding need testing before integration. Do not collect learner Hugging Face access tokens as an improvised quota workaround.

Oracle's public free-tier page currently lists 2 Ampere A1 cores and 12 GB memory. This is CPU compute, not a GPU replacement. Fitting a quantized tutor plus Whisper and voices and meeting conversation latency are unproven on that allowance, and capacity/account verification still apply. It is not the selected deployment.

## What the owner must do

Complete account signup and provider terms personally. Never paste database passwords or hosting tokens into chat. Provide the resulting non-secret project/service names or URLs after setup. Any step granting a new host access to the existing Neon database must be explicit and use the host's secret settings.

## Sources

- Render Free: https://render.com/docs/free
- Render deployment schema: https://render.com/docs/blueprint-spec
- Hugging Face ZeroGPU eligibility, compatibility and quotas: https://huggingface.co/docs/hub/spaces-zerogpu
- Oracle current free tier: https://www.oracle.com/cloud/free/
