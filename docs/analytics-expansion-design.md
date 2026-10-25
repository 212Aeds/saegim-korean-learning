# Saegim beta measurements — proposed scope

Status: design for review; the additional collection and monitoring below are not enabled.

## Questions

1. Which learning sections and actions are used most?
2. Do speech recognition, conversation generation and voice playback succeed, and how long do users wait?
3. Are the public website and account/database API reachable?

Existing Cloudflare Web Analytics measures page visits and page loading performance. Its current installation deliberately disables SPA navigation tracking; it does not measure the learning section tabs. Existing `/v1/health` checks database connectivity. Neither proves that a generated conversation or microphone playback works on a phone.

## Approaches

- Cloudflare alone: no additional storage, but does not answer feature/action counts or actively detect outages in this installation.
- Add bounded first-party aggregates and synthetic availability checks (recommended): uses existing Neon/Render plus a free eligible GitHub Actions runner, avoids a new analytics vendor, and separates visits from actual feature activity. Requires a small collection endpoint and restricted reporting tooling.
- A full product analytics/error replay service: easier dashboards, but introduces another vendor, quotas and privacy configuration. Session replay is excluded regardless of vendor.

## Recommended implementation

- Allowlisted counters: section opened (Today, Learn, Practice, Review, Words, Speak, Tutor); lesson started/completed; conversation request success/failure; speech transcription success/failure; voice preparation/playback success/failure. Do not send specific lesson/card IDs, skill level, voice text or answers. Count actions, never describe them as unique users or proof of learning.
- Client latency histograms: conversation response, transcription, and Listen-to-playback start, using fixed duration buckets. Keep TTS speaking pace unchanged. Separate cancelled actions from failures. Treat automatic preparation separately from user-requested playback.
- Aggregate in the browser and send bounded batches best-effort only while someone is using the app. Never wait for telemetry to finish before showing a lesson, completing sign-in, starting playback, or sending a conversation. No persistent tracking identifier, retries that keep a server awake, or telemetry loops. Respect Do Not Track and Global Privacy Control; provide a user-controlled diagnostics opt-out and update the privacy page.
- Validate a small strict payload with fixed names, counts and buckets; discard unknown fields. Enforce origin checks, payload/batch limits and a process-wide request/write ceiling. Do not attach credentials to telemetry requests or query accounts. Public event submission can be forged; these are directional beta measurements, not auditable business statistics.
- Persist daily aggregate counts in an additive database table, without individual events, account IDs, IP addresses, raw URLs, browser fingerprints, stack traces, error messages or timestamps of individual actions. Keep 30 days, clean up in bounded batches. Do not modify account/progress tables. Normal hosting connection metadata still exists independently.
- Start with an owner-only local report command using the existing database connection, showing feature rankings and bucket distributions. Do not expose a public statistics endpoint or add an unauthenticated admin page. Report access needs no new account permissions or credentials. A hosted owner dashboard is a separate enhancement.
- Add a read-only availability checker for the fixed public homepage and API health endpoint: check expected content/status, bounded response size/time, record duration, and allow one delayed retry. Clearly label Render cold starts instead of claiming zero downtime from a successful retry. No microphone, login, AI inference or private data is used in probes.
- Prepare an hourly GitHub workflow with least privilege and a short timeout, recording a job summary and failing on confirmed checks. Verify repository visibility and free runner eligibility before activation. Schedules only run from the default branch; current deployment branch is `fix/windows-local-setup`, while the local origin HEAD points to `main`. Do not silently merge application history or change the default branch. GitHub scheduling is best-effort, not continuous monitoring. Owner Actions notification preferences control delivery; no email service, recipient enrollment or paid uptime service is added.

## Verification and rollout

Use synthetic fixtures to test event allowlists, opt-outs, quotas, aggregation, latency buckets, cancellations, database failure isolation and checker timeout/content failures. Run the existing suite and hosted/API builds. Verify one synthetic aggregate report end to end without reading learner records. Deploy API before the client; old clients remain compatible and missing telemetry must not interrupt learning. Verify real collection and actual workflow execution separately, and label any remaining activation blocker. Document the implementation, interpretation, limitations and rollback in the code walkthrough.

Rollback disables the client emitter and collection route; analytics table can remain unused. Do not delete historical data or account data as part of rollout/rollback.

## Official sources checked

- https://developers.cloudflare.com/web-analytics/about/ — current RUM/page performance scope.
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule — default-branch scheduling, possible delays and inactivity behavior.

Prepared with AI assistance after inspecting the current application and deployment history. This document proposes new behavior; it is not evidence that the new monitoring is running.
