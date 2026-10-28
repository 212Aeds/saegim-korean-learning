# Developer service health and allowance reporting

The October 26 request prioritizes service problems and AI exhaustion on the private developer page. The page now orders information as service checks, AI allowance/recent results, Cloudflare traffic, collapsed usage history and separate synthetic experiments.

## Measurements and interpretation

- Page loaded: the browser reached this developer page, not an external uptime measurement.
- Account API/database: a bounded request to the existing health endpoint on opening the page or clicking Refresh status. A disconnected-database response is distinguished from a network/check failure. A failed browser request can be an outage, cold start or connectivity problem; it does not prove a global outage. No polling, scheduled jobs or automatic notifications are enabled.
- Hosted AI configuration: the existing Cloudflare configuration predicate, not an inference availability test. No credentials are returned.
- App allowance: the existing UTC project reservation counters and exact free Cloudflare request/token limits used by ProviderUsageService. The report is read-only and never calls reservation functions. It shows exhausted only when another tutor reservation cannot fit the current project caps. The per-learner cap is displayed separately and is not a claim that every account has that many calls remaining. Unsupported backends or invalid counters return unknown. Provider allocation remains separate from app caps.
- Recent provider outcomes: at most one result each for tutor and Whisper, held in API-process memory. Only a fixed outcome, completion timestamp and bounded elapsed milliseconds are retained. No account ID, request body, prompt, recording, provider body or raw error text is retained. Data resets on restart and reports the most recently completed provider exchange, not final tutor-answer validation, universal/current availability or average latency. HTTP 429 means rate/quota limited; its exact cause is unknown because provider error bodies are not recorded. Ordinary failed/invalid requests stay generic. TTS on a learner device is not covered by server checks.

Existing server-side owner authorization and private/no-store caching remain in place. Auth failures clear the displayed report. Refresh failures label previous snapshots as out of date. Diagnostics failure does not enable a fallback provider, add retries, alter playback pace, change models or increase quota/billing limits.

## Verification

Tests cover request/token cap exhaustion, remaining allowance, missing/invalid counters, unsupported providers, snapshot isolation, and mocked 429-to-success recovery without retaining synthetic content. Existing authorization/provider tests remain applicable. A local-only HTTP fixture served the actual built dashboard with synthetic reports: database failure, network failure, exhausted app allowance, provider 429 and failed transcription labels were exercised without contacting any real AI or recording a microphone. Refresh and collapsed history controls were clicked in the browser.

The final full suite passed 245 tests; focused provider/health tests also passed. API and hosted builds passed. Hosted startup budget locally was 353,771 gzip bytes, below 360,000. Live checks are recorded after deployment. No physical-device, lower-latency or continuous-uptime claim is made.

Official guidance checked: https://developers.cloudflare.com/workers-ai/platform/errors/ and https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-429/ . HTTP 429 can represent several limitations; this implementation deliberately does not equate it with confirmed daily allocation exhaustion.

AI assisted implementation and synthetic testing. Rollback removes the provider observation calls and new report fields/UI; no database migration or deletion is needed.

## Deployment verification — October 26 (Pacific time)

API 0ccce5b is live as dep-dbfgsmvavr4c73e4ascg. The matching website is live as dep-dbfvnc142hec73d56920; Render startup gzip bytes were 355,039, below the existing 360,000-byte budget. The existing owner session loaded the new status cards, app allowance and collapsed history, and Refresh status completed with API/database responding. Browser warnings/errors were absent. No AI inference was triggered for the live check; provider observations correctly showed no observed requests in the current API process.

An initial anonymous request timed out during free-host wake-up; the subsequent health request returned 200 and anonymous developer access returned 401. This is evidence of an observed cold-start delay, not a claim of zero lag or continuous uptime. Five previously reported high-severity dependency advisories remain; no dependencies changed in this work.


## Defensive validation follow-up — October 27

Synthetic testing found that Number(null) and Number('') can turn a malformed present quota row into a zero token count. The report now distinguishes an absent daily row (zero reservations) from an incomplete or malformed row (allowance unknown). This is defensive validation; no production database corruption was observed. Actual PostgreSQL token counters are non-null. It does not change inference admission, caps, billing, authentication or collected fields.

The regression test failed before the patch. All 13 focused health, authorization and provider tests then passed, and the API build passed. The production dependency audit currently reports four high and one moderate finding; no dependency changes were made. This follow-up is committed for the next API deployment, not yet live. The already deployed dashboard remains in place.


## Quota-validation deployment — October 28

Completed the queued defensive validation increment. The same 13 focused tests and API build passed again before publication. Commit 51453bf deployed successfully to the existing free API as dep-dbh4l54s728c73ashm1g. Same-origin health returned HTTP 200 with database connected; anonymous developer access remained HTTP 401. No provider inference, microphone recording, learner-data fixture, credential or permission change was used. The website build was unchanged. Native dependency audit still reports four high and one moderate finding; this deployment does not resolve those advisories.

