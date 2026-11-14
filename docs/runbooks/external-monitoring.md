# External monitoring

## Downtime alert
UptimeRobot monitors the public website and `/v1/health` API endpoint every five minutes on its free plan. Only the owner's email contact is attached; SMS, calls and paid features remain off. The API timeout is 60 seconds to allow for free-hosting wake-up. These are HTTP availability checks, not proof that AI inference, microphone permission or audio playback works.

When an alert arrives, check the website and API monitor separately, then inspect the existing Render API logs and owner-only developer service report. A recovered cold start is different from a recurring status-1 process exit. Do not send real learner messages or credentials as diagnostic test data. Escalate persistent infrastructure failures through Render support after saving the relevant sanitized error and deployment ID.

Frequent health polling can affect free-host usage; five-minute checks are not an uptime guarantee or a replacement for usage caps. Do not create an inference monitor that consumes the AI quota on every check. Notification delivery has not been test-fired yet. A direct public API HEAD check returned HTTP 200.

## Search visibility
Google Search Console uses the homepage's `google-site-verification` metadata for the creator's existing Google account. This public verification value is not a password or API credential. Keep it in place after verification. Submit `https://saegim.onrender.com/sitemap.xml` through Search Console; discovery files already exclude API paths. Indexing and rankings are not guaranteed.

## Sentry rollout gate
Sentry account creation is awaiting the creator's Terms of Service review. No Sentry SDK, DSN or learner error reporting is enabled yet. The intended scope is sanitized crash reporting only, with session replay, personal data, chat/recording content, request bodies and paid add-ons disabled. Verify synthetic reports and startup-size limits before activation.

AI assistance was used to configure monitoring and verification metadata. The existing 305 tests and hosted build passed; exported verification metadata was checked. This does not claim physical-device testing or continuous manual monitoring.

References: https://support.google.com/webmasters/answer/9008080 and https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/ .

## Activation evidence
Render published code commit e9b1d8d successfully. The root homepage served its prior cached HTML for up to the configured 300-second shared-cache window; after expiry, the public verification tag appeared and Google confirmed ownership. The initial API monitor recorded Render's hibernate-pending-wake HTTP 503, reported the owner alert email sent successfully, and then recovered to Up on its next scheduled check. The measured monitor incident duration includes the five-minute polling interval and is not the exact application outage duration. Website monitoring also reported Up. Sentry remains pending legal acceptance; no SDK is enabled.
