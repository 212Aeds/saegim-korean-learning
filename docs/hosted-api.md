# Hosted account API: ready for account setup

Status: deployment files prepared; **no hosted service has been created**. Render signup and access to the repository are still needed. The repository branch containing these files must be pushed before Render can read them. No credentials are committed.

## Deploy the account API

1. Create/sign in to a Render account at https://dashboard.render.com. Choose a free Hobby workspace and do not enable paid compute or add a payment method for this setup.
2. Connect the GitHub repository `212Aeds/sori-korean-learning`, branch `fix/windows-local-setup`, as a Blueprint using `render.yaml`. Review the service: one **Free** Node web service plus one static website, no new database, no disk, no AI hardware. Automatic deployments are off.
3. Enter the existing Neon pooled PostgreSQL connection string as the server-only `DATABASE_URL` secret, including `sslmode=require`. This grants this API access to that database; enter it yourself in Render, never in the website's public environment variables.
4. Set `WEB_ORIGINS` to your final website HTTPS origin, with no trailing slash. Keep the spending and AI flags exactly as provided.
5. Deploy both services. The static website publishes lessons, review and recorded audio without localhost dependencies. Check `https://YOUR-API.onrender.com/v1/health` returns `status: ok` and `database: connected`. Do not rerun database migrations blindly; the existing Neon schema is already used locally.

## Connect the website

The current `build:free` export intentionally has account sync and live AI disabled. An API deployment alone will not enable sign-in in that package. The next web release needs the real HTTPS API URL and account mode enabled while AI remains disabled.

Sessions use HttpOnly, Secure, SameSite=Lax cookies in production. Use a same-origin reverse proxy for `/v1` or a website/API pair under the same registrable custom domain. Unrelated default host domains can block cross-site cookies; do not weaken cookie settings to hide that problem. The domain and hosting URL are needed before this connection can be verified.

## Model services

This Blueprint does not host Qwen, Whisper or Supertonic. Render Free provides 512 MB RAM and no GPU, so it is not suitable for the existing stack. Keep the prerecorded audio in the static website. To run the existing live AI without your laptop and without personal spending, obtain donated/sponsored compute first. No GPU allocation has been secured and no model-service deployment has occurred.

The Flask speech server currently trusts loopback hosts and has no public authentication layer; it must not be exposed directly. Future hosting needs a private model network, authenticated API gateway, concurrency/request limits, HTTPS and capacity testing. Ollama should stay private too.

Render Free sleeps after 15 minutes without inbound traffic and is suitable for beta testing with cold-start delays, not an uptime guarantee. Monitor the provider's free usage allowance and do not upgrade automatically.

## Rollback

Suspend the Render service to stop accepting requests. Restore the previous website deployment if a later API-enabled release fails. Existing Neon data remains in Neon; this deployment does not create or delete a database.

Sources checked 15 October 2026:
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://render.com/docs/node-version
- https://huggingface.co/docs/hub/spaces-overview
