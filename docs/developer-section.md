# Private developer section and beta invitations

The creator chose a hosted developer section restricted to the existing aeden.gray2@gmail.com account on October 26, 2026. This implements private access, not approval to enable additional event collection or uptime notifications.

## How it works

`DeveloperController.overview` uses the existing SessionAuthGuard to validate a hashed session against its expiry. It then reads the email for that authenticated account ID from the database and checks the explicitly selected owner address. A browser-supplied email or a forged developerAccess flag is never authority. Requests without a valid session are rejected; signed-in non-owner accounts receive 403 before aggregate usage is queried. The response is private, no-store. Email cannot be changed through the existing profile endpoint. No new credential, identity provider or account migration is involved.

The auth response supplies a developerAccess display hint so only the owner sees the Developer navigation link. The static `/developer/` page contains a generic access shell, not private data. Its client fetches the guarded endpoint before displaying quota totals, links or the synthetic experiment. Hiding the link is a convenience; the server check protects the data. JavaScript for the synthetic demonstration is public and must never contain secrets. Direct access to the page does not bypass the API check.

The report displays at most 30 days of existing UTC project quota reservations from provider_project_usage. These counts include reservations for failed calls and do not measure unique users, completed conversations, transcription accuracy or costs. It performs no new telemetry collection or provider call. Cloudflare visits/performance remain in Cloudflare's separately authenticated dashboard. The original analytics lab is still an environment-gated local demo; production must leave its flag unset.

The public beta invitation now offers a Hangul guide, optional feedback, native sharing with fallback, an editable invitation and an existing QR code. It does not send invitations automatically, track recipients, promise unlimited AI or require feedback to learn. Clipboard failures show manual-copy guidance; cancellation of native sharing is silent. The draft clearly identifies the creator and beta status and asks people to respect community rules.

## Verification

Four focused synthetic authorization tests cover owner access, missing sessions, other accounts despite a forged email, deleted account, guard registration and private response caching. The full suite before the final metadata assertion passed 240 tests; the four focused tests verify the final authorization code. API and hosted builds passed; local hosted startup is 353,767 gzip bytes, below the 360,000-byte budget. No learner microphone, provider request, credentials or account/progress mutation was used in testing.

Official sources: https://docs.nestjs.com/guards and https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share . Local pinned Next.js page and use-client guidance was used for route/client boundaries. AI assisted implementation and synthetic verification. Deployment/runtime checks are recorded after publication.

Rollback: remove the controller registration and developer navigation/page, rebuild and redeploy. Existing accounts and quota tables need no migration or deletion. Keep the live collector changes separate from this work.
