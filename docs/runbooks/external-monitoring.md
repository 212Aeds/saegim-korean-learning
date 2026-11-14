# External monitoring

## Downtime alert
UptimeRobot monitors the public website and `/v1/health` API endpoint every five minutes on its free plan. Only the owner's email contact is attached; SMS, calls and paid features remain off. The API timeout is 60 seconds to allow for free-hosting wake-up. These are HTTP availability checks, not proof that AI inference, microphone permission or audio playback works.

When an alert arrives, check the website and API monitor separately, then inspect the existing Render API logs and owner-only developer service report. A recovered cold start is different from a recurring status-1 process exit. Do not send real learner messages or credentials as diagnostic test data. Escalate persistent infrastructure failures through Render support after saving the relevant sanitized error and deployment ID.

Frequent health polling can affect free-host usage; five-minute checks are not an uptime guarantee or a replacement for usage caps. Do not create an inference monitor that consumes the AI quota on every check. Notification delivery has not been test-fired yet. A direct public API HEAD check returned HTTP 200.

## Search visibility
Google Search Console uses the homepage's `google-site-verification` metadata for the creator's existing Google account. This public verification value is not a password or API credential. Keep it in place after verification. Submit `https://saegim.onrender.com/sitemap.xml` through Search Console; discovery files already exclude API paths. Indexing and rankings are not guaranteed.

## Sentry rollout gate
The creator completed Sentry signup. The browser integration uses pinned @sentry/browser 11.12.0, loaded 1.5 seconds after the page load event. Only GlobalHandlers is enabled; replay, tracing, logs, sessions and repository/source fetching are off. beforeSend rebuilds each event from an allowlist: built-in error category and same-origin static JavaScript frame location only. Original error messages and all unknown fields are discarded. Ten distinct reports per page are allowed; duplicate stacks are suppressed. Browser privacy signals and internal/preview routes disable reporting. IP storage prevention is enabled in project settings. UptimeRobot covers HTTP availability; no Sentry API-server SDK was added.

AI assistance was used to configure monitoring and verification metadata. The existing 305 tests and hosted build passed; exported verification metadata was checked. This does not claim physical-device testing or continuous manual monitoring.

References: https://support.google.com/webmasters/answer/9008080 and https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/ .

## Activation evidence
Render published code commit e9b1d8d successfully. The root homepage served its prior cached HTML for up to the configured 300-second shared-cache window; after expiry, the public verification tag appeared and Google confirmed ownership. The initial API monitor recorded Render's hibernate-pending-wake HTTP 503, reported the owner alert email sent successfully, and then recovered to Up on its next scheduled check. The measured monitor incident duration includes the five-minute polling interval and is not the exact application outage duration. Website monitoring also reported Up. The Sentry rollout is recorded below.

## Sentry verification
The pinned SDK's real transport returned HTTP 200 for an explicitly synthetic code-location event. Sentry displayed JAVASCRIPT-1 with the privacy-safe message and synthetic monitoring-check filename. No learner content was used. Local SDK-envelope inspection confirmed mock private strings were absent. Four new tests cover privacy gates, allowlisting, deduplication/caps and SDK configuration; all 309 repository tests passed. Hosted build passed at 358,787 gzip startup bytes under the unchanged 360,000-byte limit. The new account starts with Sentry's no-card trial and the onboarding explicitly states it falls back to free volumes after 14 days; no payment method or paid add-on was enabled.

Release 85dc6f1 is Live on Render. Public index.html and the deferred SDK chunk returned HTTP 200, the chunk contained the correct public ingestion identifier, and the updated privacy notice was published. A fresh public browser page opened with no warning/error console entries. Sentry displayed the synthetic event, with zero identified users and no replay/attachments; the test issue was marked resolved. Sentry can derive coarse geographic information from the ordinary ingest connection even with IP-address storage prevention; no claim of anonymous network access is made. Local and Render chunk hashes can differ across builds; byte-for-byte HTML identity was not used as a release criterion. No physical iPhone or complete end-to-end feature test is claimed for this monitoring change.
