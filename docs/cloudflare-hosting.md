# Cloudflare hosted beta setup

Status: adapters and deployment builds exist locally. **No Render or Cloudflare service was created and no real Cloudflare inference was run.** No connected hosting account or Cloudflare token is available yet. Mocked provider tests do not prove account eligibility, latency, capacity or Korean response quality in production.

## Architecture

Render hosts the public static website and the existing Nest API; Neon remains the database. The API calls Cloudflare's already-hosted Qwen3-30B-A3B model and Whisper Large V3 Turbo over HTTPS. No dedicated GPU VM or custom Worker is required. The local Ollama/Flask setup remains separate.

All tutor and transcription calls require an existing Saegim session. Database-backed atomic limits share a default allowance of 200 AI requests/project/day and 25/account/day. Failed provider calls consume reservations. These are request controls, not an exact meter of Cloudflare Neurons. No paid model fallback is implemented.

Chris/Jessica recorded clips remain packaged with the website. This integration does not host Supertonic or generate new Chris/Jessica conversation audio. Unrecorded replies use available browser Korean speech; those voices can sound different. Exact dynamic voices still require a synthesis host.

## Repository

The setup is pushed on branch `fix/windows-local-setup` at `https://github.com/212Aeds/saegim-korean-learning`. GitHub reports the former `sori-korean-learning` URL has moved there. Select the renamed repository in Render.

## Provider setup (owner action required)

1. Finish Render signup and connect GitHub. Complete Cloudflare signup and select **Workers Free**. Do not upgrade the Workers plan or add prepaid AI Gateway credits for this deployment.
2. In Cloudflare, open Workers AI → Use REST API → Create a Workers AI API Token. Scope it to this account. The official template grants Workers AI Read and Edit. Record the Account ID too. Save the token only in Render's API service secret settings; never put it in chat or a web build.
3. Deploy the API with `render.yaml`, the existing Neon pooled `DATABASE_URL` secret and the real website `WEB_ORIGINS`. Set the following API environment values when ready:

```
TUTOR_PROVIDER=cloudflare
SPEECH_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=<your account ID>
CLOUDFLARE_API_TOKEN=<server secret>
CLOUDFLARE_FREE_PLAN_CONFIRMED=true
PROVIDER_TERMS_REVIEWED=true
PAID_FEATURES_ENABLED=false
OPENROUTER_AUDIO_ENABLED=false
PROVIDER_MONTHLY_SPEND_CAP_CENTS=0
FREE_AI_PROJECT_DAILY_LIMIT=200
FREE_AI_ACCOUNT_DAILY_LIMIT=25
```

`CLOUDFLARE_FREE_PLAN_CONFIRMED` is an operator assertion after inspecting the dashboard. The code cannot guarantee zero Cloudflare charges if the account is later upgraded. On Workers Free, quota exhaustion fails requests; use no paid upgrade or credits. Review Cloudflare's data policies before confirming the terms flag.

## Website connection without cross-site cookies

Once the API URL is assigned, add a Render static-site rewrite **before other routes**:

- Source: `/api/*`
- Destination: `https://YOUR-ACTUAL-API.onrender.com/*`
- Action: Rewrite

Use the API URL actually assigned by Render, not an assumed hostname. Set the website build environment `NEXT_PUBLIC_API_URL=/api`, build command `npm ci --include=dev && npm run build:hosted`, and publish path `apps/web/.next-hosted-public`. The `/api` rewrite keeps browser requests and the HttpOnly session cookie on the website origin. Set API `WEB_ORIGINS` to that exact HTTPS website origin. Verify cookie preservation through the deployed proxy before releasing account sync. Do not change SameSite protections to work around a failed proxy.

The committed Blueprint deliberately still deploys the device-only free website and disables AI until accounts and this routing are configured. `build:free` remains device-only; `build:hosted` explicitly enables accounts, tutor and transcription and clears laptop endpoints. The two artifacts are different releases.

## Acceptance checks before opening the beta

- API `/v1/health` reports the existing database connected.
- Signup/sign-in, reload, sign-out and saved progress work through the website's `/api` rewrite.
- Signed-out tutor and transcription requests return 401 before model inference.
- Signed-in `/api/v1/speech/status` reports transcription available and synthesis false.
- Ask one grammar question and complete two conversation turns; inspect their Korean and translation.
- Record a short Korean phrase, confirm transcription and romanization, then cancel a recording and retry.
- Test quota exhaustion and unavailable providers; no paid fallback, credential leakage or permanent spinner.
- Verify both recorded voices; explain browser-voice limitations before advertising dynamic Chris/Jessica replies.

On failure, set API `TUTOR_PROVIDER=disabled` and remove `SPEECH_PROVIDER`, rebuild the site with `build:free`, and restore the previous static deployment. No database changes are required for these adapters; existing quota functions are reused.

## Sources checked 15 October 2026

- https://developers.cloudflare.com/workers-ai/get-started/rest-api/
- https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/
- https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://render.com/docs/redirects-rewrites
