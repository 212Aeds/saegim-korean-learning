# Public Saegim using the current models

## Recommendation: laptop-hosted beta, same models

Keep Qwen3:14B in Ollama, Whisper medium on CUDA, Supertonic 3 Chris/Jessica presets, the Next.js frontend, the Nest API, and the existing Neon database. No retraining, provider migration, or new model subscriptions are needed. A tunnel changes how visitors reach the app, not its AI.

Recommended request path:

Visitor HTTPS -> public Saegim hostname -> Cloudflare Tunnel -> local reverse proxy -> Next.js / Nest API -> private Ollama and Flask speech services.

The reverse proxy should route /v1/* to Nest and other paths to Next.js. Nest must expose authenticated speech proxy routes before public speech works. It calls Flask over loopback; only Nest calls Ollama. Do not tunnel Flask or Ollama directly. Deploying the current browser build as-is will not work: it embeds localhost:4004 and 127.0.0.1:5055, which refer to each visitor's computer.

## Implementation steps, in order

1. Add authenticated Nest speech endpoints for transcription (bounded multipart upload) and synthesis (bounded JSON). Reuse the current session validation; return audio through the API rather than redirecting to Flask. Forward cancellation and enforce timeouts. Keep provider URLs server-side.
2. Update the browser speech transport to use those endpoints with its existing session credentials. The local browser path can remain available for development. Use a shared public origin for web/API to simplify browser authentication and HTTPS microphone access.
3. Apply server-side per-account usage limits, small model concurrency limits and a bounded waiting queue. Return a clear busy response; don't silently enable paid providers. Restrict payload sizes and allowed origins. CORS alone is not authentication. Do not cache personalized transcripts or replies at the edge.
4. Add a beta status message when the model backend is offline. Lessons and review should remain usable where possible. Decide who may join the beta before enabling public account creation at scale.
5. Choose a domain and create its DNS/tunnel configuration. Install official cloudflared and configure a named tunnel to the reverse proxy. A named public hostname needs an account and domain setup; temporary Quick Tunnels are for testing, not a durable production URL.
6. Build with the real HTTPS web/API URL instead of loopback addresses. Configure exact web origins, proxy trust and secure authentication settings, then test login, progress, uploads, streaming/audio cancellation, and microphone capture from a separate network.
7. Set up deliberate startup, health checks, updates and logs without recording private audio or tokens. The laptop must stay powered, awake and connected during advertised beta hours. Do not change Windows sleep settings automatically.
8. Verify all current model/voice licenses for public distribution and use. Publishing an app does not transfer model ownership or change a model's license.

## Cost and capacity

This keeps per-request model API bills at zero. It still uses your electricity, hardware and internet connection. A domain usually has a recurring registration cost. Check current tunnel plan limits and terms before launching. A laptop is suitable for a small controlled beta, not a promise of unlimited simultaneous users or 24/7 availability. Measure concurrent latency on this machine before setting beta size.

If you need the app online while the laptop is off, move these same weights and services to an always-on GPU computer. That is deployment, not relearning or retraining AI. A rented GPU normally costs money; donated hardware or funding can cover it later. Keep the backend contract stable so the website does not need to change when the inference machine moves.

## Prepared versus live

This document is the concrete deployment plan. No public tunnel, DNS change, account signup, firewall opening or public model exposure has been performed. The next implementation slice is the authenticated speech gateway, followed by public deployment configuration and external-network verification. Domain/account configuration is required before a real public hostname can be connected.

Official references:
- https://developers.cloudflare.com/tunnel/
- https://developers.cloudflare.com/tunnel/get-started/
- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- https://docs.ollama.com/faq
