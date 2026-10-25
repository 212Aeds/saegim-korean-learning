# Try the analytics lab

October 25, 2026. User requested separate testing before adoption. This is a synthetic UI evaluation, not a live collector or outage monitor.

Open http://localhost:3038/analytics-preview while the local preview server is running. Pick a feature, simulate a quick/slow success, failure or cancellation, and compare metrics. Try Healthy, Slow recovery and Outage. Try empty data and Reset demo. Refresh resets all sample data. No data is sent, saved, or linked to accounts.

## How it works

`apps/web/app/analytics-preview/model.ts` validates fixed fixture names, counts outcomes, and computes nearest-rank p50/p95 over successful fixtures. Cancellations do not count as failures. With no successful samples, latency is unknown rather than zero. Availability distinguishes a successful retry from a first-attempt success.

`preview.tsx` stores fixtures in React memory. No fetch, provider, audio, recording, analytics endpoint or persistent storage is used. CSS wraps controls and changes metrics to two columns on phones, with visible keyboard focus and reduced-motion support. `page.tsx` returns notFound unless SAEGIM_ANALYTICS_PREVIEW=true at build time, with noindex metadata. This gate is not authentication; never add private real data to this page.

The live analytics expansion remains a proposal in analytics-expansion-design.md. This preview intentionally uses individual synthetic fixtures to demonstrate the report; a real implementation would store daily aggregates and duration buckets instead. The demo does not prove live ingestion, monitoring, notifications or physical-phone functionality.

## Verification

- Five new model tests watched fail before implementation, then pass.
- Full suite: 236 tests passed, including pre-existing unpublished feature-preview tests.
- Separate build: SAEGIM_ANALYTICS_PREVIEW=true, SORI_WEB_DIST_DIR=.next-analytics-preview; build passed.
- Browser clicks: 10-second success updated p95 to 10.00s; outage and recovery displayed distinct states; feature selection, failure, cancellation, empty data and reset worked. Quick success at narrow viewport worked.
- Narrow viewport: client and scroll widths both 375px, no horizontal overflow. No browser warnings/errors; zero Cloudflare beacon elements on localhost.
- No physical iPhone testing, no real visitor data accessed, no real alerts sent. No production deployment.

Restart locally (PowerShell, repository root): set SAEGIM_ANALYTICS_PREVIEW=true and SORI_WEB_DIST_DIR=.next-analytics-preview, run npm run build:web, then npm --workspace @sori/web run start -- --port 3038. The current server remains available for review. Stop that server to end the preview. Production builds must leave SAEGIM_ANALYTICS_PREVIEW unset.

Prepared with AI assistance. Existing account/progress, voice engine, playback speed, usage caps and paid-provider settings were not modified.
