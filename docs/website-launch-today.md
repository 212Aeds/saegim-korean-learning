# Website launch handoff — 15 October 2026

Publish the static beta with `npm run build:free`. Upload the **contents** of `apps/web/.next-public` (or extract the refreshed `../outputs/saegim-public-site.zip`) to your static website host. Keep `_next`, `audio`, `_headers`, and the route folders intact. Never upload `.env.local`, model folders, or the repository itself as the website.

This build offers lessons, level-based pathways, flashcards, review, writing practice and 162 prerecorded Korean clips in Chris and Jessica voices. Other phrases may use an installed Korean browser voice when available. Progress is stored in the visitor's browser. Live AI Tutor, microphone transcription and cloud account sync are excluded until a separate backend is deployed. Publishing the static files does not host Flask, Ollama or Neon account endpoints.

Before sharing the URL:

1. After building, generate discovery files using `npm run site:configure -- --url https://YOUR-DOMAIN`, then repackage or upload the output. This creates the sitemap and robots file for the real address.
2. Open the deployed site on a phone and desktop; complete onboarding, a lesson and a review. Reload and confirm progress remains.
3. Test both audio voices, pace and Stop in Speak. Confirm audio assets return successfully from the deployed host.
4. Check About, Privacy, Terms, word references and feedback. Describe this release as a beta; do not promise live AI or pronunciation scoring.
5. For future public AI: deploy an authenticated API and model service behind HTTPS, restrict allowed origins, limit concurrency and request rates, and test capacity and recovery. Keep database and model credentials server-side. Never expose the raw local model ports.

Local verification this pass: 90 app tests passed. Browser testing obtained a real tutor explanation and a Korean conversation reply, and confirmed the phrase helper inserts and sends a message. The first cold-start tutor request lost its connection and succeeded on retry; cold starts remain a local service limitation. Microphone edge cases are covered by existing capture tests, not a claim of perfect recognition for every accent or device.

