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


## Analytics polish — October 30, 2026

Cloudflare was already configured for saegim.onrender.com. Opening its existing
site report confirmed ingestion: the selected last-24-hours report showed 4
visits, 6 page views, a 718 ms page-load figure and LCP p75 1,148 ms. This small
sample included developer-page views and may include owner/tests; it is not a
unique-person count or evidence of universal performance. No duplicate site,
DNS change, new credential, paid plan or additional collector was created.

The installed beacon now skips developer and preview paths. This prevents future
internal-page loads from inflating learner traffic; it cannot remove historic
counts or exclude an owner's ordinary homepage testing. Existing exact-host,
DNT/GPC, single-install and SPA-off behavior remain. Cloudflare documentation
checked: https://developers.cloudflare.com/web-analytics/get-started/ and
https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/ .

The private dashboard now owns its layout styles rather than importing the demo's
layout. Four compact totals describe existing API reservations: UTC today, 30-day
all requests, 30-day tutor requests and days with requests. These are explicitly
not visitors, unique learners, successes or feature-popularity metrics. Traffic
remains in the separately authenticated Cloudflare report; no API key is exposed
to the browser. History and explanatory details are collapsed; the synthetic
experiment still loads only when requested. Health response duration is one
browser's observed check, not an average or continuous uptime claim.

`app/developer/report.ts` validates the 30-day snapshot before rendering. Missing
usage, invalid counters/dates, duplicate or future dates cannot turn into false
zero totals or a render crash. Optional malformed provider/allowance diagnostics
become unknown while valid reservation rows can still display. Refresh failures
label old snapshots; 401/403 removes private statistics and the open experiment.
No new inference or microphone capture is triggered by refreshing.

Verification: the internal-route exclusion regression failed first; all six
focused tests then passed. All 280 repository tests and the hosted production
build passed. Startup JavaScript: 356,047 gzip bytes (360,000-byte limit). Browser
fixture tests used synthetic responses only and exercised totals, daily history,
refresh, malformed JSON shape, access revocation, database failure, exhausted
allowance/provider 429, empty rows and the lazy demo. At the observed 375px client
width, scroll width was also 375px and buttons were about 49px tall. No browser
warnings/errors or local analytics beacon were observed. Physical iPhone testing
and lower AI/TTS latency were not established. Existing voices, speaking pace,
account/progress data, usage caps and authentication were unchanged.

AI assisted investigation, implementation and testing. Local old analytics-preview
servers were stopped before this task; that demo URL is not the live owner
report. Production and GitHub verification follow after publication.

### Live verification

Commit `6f14be2` deployed successfully to the existing free static website as
`dep-dbikeb5g1s2s73dgj0mg` in 1m22s. The existing signed-in owner session loaded
the new layout and real aggregate rows; Refresh status worked and no browser
warnings/errors were reported. The developer page had zero analytics-beacon
nodes, while the public privacy page had one correctly sourced Cloudflare beacon.
The live traffic link points to the existing verified Saegim Cloudflare site.

Read-only public probes returned homepage 200 (289 ms), API/database health 200
(186 ms) and unauthenticated developer report 401 (118 ms). These are individual
warm observations, not a benchmark or promise about cold starts/phone playback.
No API redeploy was needed. The local synthetic fixture was stopped after checks.
Unrelated unpublished feature-preview files were preserved.

## Expanded statistics and simpler entry — October 30

The creator requested the available analytics in one place plus ongoing website
improvements. The owner report now includes fixed-size provider reliability
summaries: counts of successful, limited and failed exchanges, plus successful
response p50/p95 latency-bucket upper bounds. Ten fixed buckets per provider are
kept in process memory, not a list of events. No account identifiers, prompts,
transcripts, recordings, URLs or individual timestamps are added. The observation
start time and counters reset on API restart; they are not 30-day or all-time
success statistics. Limited/failed exchanges do not enter successful-latency
estimates. Invalid timings are excluded from the timing histogram. This observes
existing Cloudflare exchanges only and never triggers a test inference or changes
admission caps, models, voices, speaking pace or billing.

The daily history also displays the existing reserved tutor-token counter. It is
a conservative budget reservation, not actual provider tokens or money spent.
A coverage table explicitly identifies missing device TTS/microphone accuracy,
feature popularity and continuous uptime measurements. No fictional zero or
sample statistics are substituted for these gaps.

The public hero now has one primary guest-start action and one quiet sample link,
instead of competing primary starts and an extra account-creation button. Sign-in
remains in navigation, and the optional account flow is still available there.
Unexpected hello-audio rejection now produces the same retry message as unavailable
audio, without changing the voice. The primary action reached guest onboarding in
the browser fixture without an email or account request.

Direct Cloudflare traffic sync remains a separate authorization step. Official
Cloudflare guidance requires an Account Analytics: Read token for its GraphQL
API: https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/ .
The existing token was authorized for Workers AI only and is not broadened or
repurposed. A new read-only token would be restricted to the existing account,
stored only in Render, with owner-only server responses. Live schema discovery
and aggregate query verification must precede implementation of those queries:
https://developers.cloudflare.com/analytics/graphql-api/features/discovery/introspection/ .
No credential or permission has changed in this increment. Do not claim traffic
sync is active merely because the external Cloudflare report is working.

Verification: new provider-summary and single-entry tests failed first. All 284
tests, API build and configured hosted build passed. Startup budget: 356,041 gzip
bytes. Synthetic dashboard fixtures showed 80%/100% provider-success shares and
bucket bounds matching known outcomes; coverage and token-history tables opened.
At the observed 375px client width, document scroll width remained 375px. A real
microphone, private learner content or provider inference was not used in testing.
AI assisted implementation and tests. Deployment results follow below.
