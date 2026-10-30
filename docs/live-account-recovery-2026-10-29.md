# Live account-service follow-up — 2026-10-29

The creator clarified that the unavailable-account message occurred on the live
website. The preceding file-preview fix addresses a separate reproduced problem
and does not establish a fix for this live report. A warm health endpoint and an
invalid-password response do not exercise successful session/progress loading.

## Investigation

Read the actual successful-login, session creation and bundled progress paths.
Inspected database schema metadata only: required account/session/progress/rate
limit tables and expected columns were present in the configured database. No
private learner records were dumped. Reviewed Render's 24-hour application logs;
no relevant error was visible, and handled database errors lacked diagnostics.

A synthetic successful-login check ran the built AuthController against the
configured database inside one explicit transaction. It inserted a randomly
named synthetic account, verified password/session creation, wrote synthetic
empty progress and verified a subsequent login returned it. All operations used
the same transaction/client; finally ROLLBACK removed every diagnostic account,
session, rate-limit and progress change. No real password, token or learner
content was used or printed. This verifies that path in the configured database;
it does not reproduce the creator's browser failure or verify Render's secret
configuration is identical.

## Reproduced defect and fix

DatabaseService had no handler for the PostgreSQL pool's background error event.
[The official pg pool documentation](https://node-postgres.com/apis/pool#error)
explains that idle connections can emit errors, that pg automatically removes a
failed idle client, and that an unhandled pool error can crash the Node process.
An EventEmitter pool fixture reproduced the exception before the patch. This is
a concrete outage risk; there is no evidence yet that it caused this exact user
attempt.

DatabaseService now handles the idle error and leaves pg to evict the failed
client. Subsequent explicit requests can use the pool. No query, transaction,
account creation or login POST is automatically replayed. The existing connection
timeout, pool size, session cookies, access rules and rate limits are unchanged.

Database query failures now record a fixed stage and allowlisted error code via
Nest Logger, then propagate normally to the existing safe error response. Logs
contain no error object/message/stack, SQL, query parameters, account identifiers,
credentials or connection URLs. Unknown codes become `unknown`. This provides a
way to identify the next actual live failure without exposing learner data or
misclassifying a passing health check as successful sign-in.

AI assisted the diagnosis, tests, code and documentation. No provider, billing,
credential, permission, authentication migration or model change is included.
Free-host cold-start delays remain possible. A real retry by the creator is
needed to confirm whether their specific failure is resolved.

## Verification and release

The idle-error regression and diagnostic regression both failed before the fix;
the final tests also verify unknown fields cannot leak into diagnostics. All
261 tests passed, API build passed, and the production dependency audit reported
zero findings. No frontend code changed in this follow-up.

API commit `68592bc` deployed successfully through the existing free Render
service, deployment `dep-dbi0qt8m7kps73bhu2p0` (1m18s). Public API health returned
200 with database connected; the anonymous developer endpoint returned 401.
Deployment screenshot: ignored
`work/mobile-tts-evaluation/live-account-api-live.png`. The creator was asked to
retry their live sign-in after this deployment; their result is still pending.
These checks do not justify claiming the original account failure is resolved.

Creator follow-up: after retrying the live site, the creator confirmed sign-in
works, with some remaining delay. This verifies recovery for their reported
attempt; it does not establish that the reproduced idle-pool bug was the sole
cause or eliminate free-host startup delays. Their request for an optional
Cloudflare sign-in experience needs clarification between Turnstile bot checks,
social sign-in and passwordless email before changing authentication.
