# Firebase Google sign-in: setup, code and verification

## Current state

Prepared on the creator's request: Firebase Spark project `saegim-35a52`, named
Saegim, and a web app named Saegim website. Confirmed $0/month in the console.
Google Analytics and Gemini were disabled during creation; Firebase Hosting was
not selected. No phone/SMS, Identity Platform upgrade, billing or paid Firebase
product was enabled. Google provider is still disabled. No service-account key
was created, no Render Firebase variables were changed and this implementation
is not live yet. Existing production sign-in is unchanged.

## How it works

1. `ui/firebase-google.ts` dynamically loads only Firebase app/auth when the
   configured sign-in control mounts. It uses in-memory persistence, prepares
   before the click for Safari's popup gesture, obtains a fresh ID token and
   signs the temporary SDK session out. It never stores a token in localStorage.
2. `ui/firebase-google-sign-in.tsx` handles explicit clicks, popup cancellation,
   loading failure, and current-password confirmation for an existing account.
   Passwords go only to Saegim's HTTPS API; never to Firebase/Google. Guest practice
   and the existing email/password form remain available. There is no redirect
   sign-in flow or new third-party analytics SDK.
3. `FirebaseIdentityVerifier` uses the official Admin SDK to verify signature,
   expiry, audience, revocation and disabled-user state. Additional checks require
   this project's issuer/subject, Google provider, verified email and authentication
   within five minutes. Emulator mode is rejected. SDK errors are not exposed.
4. `/v1/auth/firebase` accepts only an ID token and optional current password,
   uses the existing per-email/IP login limit, and issues the existing secure
   HttpOnly Saegim session. Clients cannot choose account IDs or developer access.
5. `firebase-accounts.ts` uses a transaction to bind project+Firebase UID to the
   existing Neon account ID. An email match requires current-password verification
   before linking; it never silently merges accounts or rewrites progress. A new
   Google identity creates a new account and follows existing onboarding. Its
   random server-side password hash is not a usable password login: Google-only
   users use Google; existing linked users keep their original password login.
6. Migration `012-firebase-identities.sql` adds only a mapping table with unique
   identities and account foreign-key cascade. No current account/progress row
   is migrated or modified by this migration.
7. Account deletion holds the local deletion in a transaction while removing the
   Firebase profile. Provider failure rolls local data back. An already-absent
   Firebase user is accepted so an explicit retry can finish. Google accounts
   themselves are never deleted. No external request is replayed automatically.

Firebase cleanup and a SQL commit cannot be one atomic cross-service transaction.
If provider deletion succeeds but SQL commit fails, the existing session remains
usable for retry while valid. A lost session in this rare partial state may need
owner reconciliation, particularly for a Google-only account. Do not claim
distributed deletion is perfectly atomic. Keep the provider/server credential
available for deletion/recovery even if sign-in is temporarily turned off.

## Activation checklist — pending approval

1. Obtain explicit approval for a dedicated service account with **Firebase
   Authentication Admin** (`roles/firebaseauth.admin`) on `saegim-35a52` only, a
   private credential stored in Render's API environment, and Google provider
   activation for the existing Saegim website. No project Owner/Editor role or
   access to unrelated Firebase projects is needed.
2. Enable Google only in Firebase Authentication, using Saegim as the public app
   name and the creator's chosen support email. Authorize `saegim.onrender.com`;
   retain Firebase's necessary default auth domains. Do not add wildcard domains,
   enable SMS, upgrade to Identity Platform/Blaze, or connect billing.
3. Apply **only** migration 012 with the existing database migration lock inside
   a transaction. Verify the target database before applying; do not run unrelated
   data migrations merely to add this table. Apply before enabling Google sign-in. Existing account deletion remains
   compatible when the optional table is absent; it checks table availability.
4. Store these **server-only** values in the existing Render API service:
   `FIREBASE_PROJECT_ID=saegim-35a52`, `FIREBASE_SERVICE_ACCOUNT_JSON` (private JSON),
   `FIREBASE_SPARK_PLAN_CONFIRMED=true`, and `FIREBASE_AUTH_ENABLED=true`.
   The startup preflight checks project/credential matching, Spark confirmation
   and absence of emulator mode. Never paste private JSON into chat or GitHub.
5. Use the web app's public `apiKey`, `authDomain`, `projectId`, `appId` for the
   four `NEXT_PUBLIC_FIREBASE_*` variables listed in `.env.example`. Keep
   `NEXT_PUBLIC_API_URL=/api` so the Saegim session stays same-origin. Public web
   config is not a server credential. Deploy API first, then website, after checks.
6. Confirm home/health/access checks; have the creator perform the first Google
   consent/sign-in and password-confirmation link. Do not click through Google
   account-access consent as a synthetic test or use the creator's credentials.
   Confirm saved progress is retained and email/password sign-in still works.
   Then ask a physical iPhone/Safari tester to check popup/open/cancel/link/logout.

## Rollback

Before enrolling any Google users, leaving configuration absent keeps Google
hidden and the endpoint disabled. Once Google-only accounts exist, disabling
Google removes their sign-in option; keep it available during rollback or arrange
verified account recovery. Do not invent a password, auto-link by email, drop the
identity table, or reset learning data as rollback. Existing linked password
accounts retain their original password. Keep account cleanup credentials safe.

## Sources and dependencies

- [Google sign-in with Firebase](https://firebase.google.com/docs/auth/web/google-signin)
- [Admin ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Session authentication recency](https://firebase.google.com/docs/auth/admin/manage-cookies)
- [Admin user deletion](https://firebase.google.com/docs/auth/admin/manage-users)
- [Firebase Spark pricing](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Google sign-in branding](https://developers.google.com/identity/branding-guidelines)

Pinned new SDKs: firebase 13.1.0 and firebase-admin 14.5.0 (Node >=22; deployed
Node is 24). Only app/auth modules are used. The umbrella SDK also installs unused
Firestore dependencies; its pinned gRPC version had advisories. A scoped override
for `@firebase/firestore` selects the reviewed 1.13.6 patch, not a forced downgrade
of Firebase. Server Firestore dependencies resolve patched 1.14.7. No Firestore
service, storage or API usage is configured. Sources:
[gRPC certificate authorization fix](https://github.com/advisories/GHSA-m9gg-hp2v-232j),
[gRPC error-disclosure fix](https://github.com/advisories/GHSA-f596-whhp-79r4).
The official Google G asset is served locally from
`https://developers.google.com/static/identity/images/g-logo.png`; no remote icon
request is added to the sign-in form. Google Sans Medium Latin WOFF2 (23,264
bytes) is served locally with its upstream SIL OFL license; no full 2MB font is
shipped. Branding follows the linked Google guidance.

## Evidence and limits

Focused tests cover project/provider/email/recency validation, disabled setup,
revocation-check invocation, password-gated linking, bound-account isolation,
private-field stripping, cancellation/blocked popup, explicit confirmation,
cleanup rollback and production preflight. A database transaction tested the real
SQL migration and resolver with synthetic identities, password confirmation,
stable binding, distinct account creation and FK cascade; all diagnostic schema
and row changes were rolled back. No private learner records were inspected.

Final local verification: 276 tests passed; API build and both unconfigured and
public-Firebase-configured hosted builds passed. Production dependency audit:
zero reported findings. Startup JavaScript was 355,965 gzip bytes unconfigured
and 355,964 with the public web configuration, under the existing 360,000 cap.
The additional SDK chunks are lazy, not startup-script references. The existing
recorded-audio audit passed (1,878 clips including 798 block clips).

The SDK control and state transitions have synthetic fixture coverage; a real
Google consent flow and physical Safari still require human verification. Do not claim a sign-in speedup.
Firebase does not remove Render's possible free-instance cold starts.

AI assisted the design, implementation, synthetic tests and documentation.
Unpublished feature-preview files were preserved.

## Credential provisioning, 2026-10-30

The creator approved the dedicated project-only Firebase Authentication Admin
service account and storage of its private credential in the existing Render API.
The initial console key download produced no accessible file. With explicit
creator approval, that unused key was deleted and replaced through Google
Cloud's [public certificate upload](https://docs.cloud.google.com/iam/docs/keys-upload)
flow. Only the public RSA X.509 certificate was uploaded to Google; the private
key was stored in Render, never committed. A Firebase Admin lookup of a random
nonexistent synthetic UID returned `auth/user-not-found`, verifying credentials
and the role without reading real learner records. The certificate expires
2027-10-30; arrange an explicitly authorized rotation before then.

Google provider is enabled for the Spark project, with saegim.onrender.com
authorized. Public web configuration and protected API configuration were saved
in their respective existing Render services. Billing, SMS and Firebase Analytics
remain disabled. Migration 012 created only the optional identity mapping table;
existing account and progress data were not changed. Deployment verification is
recorded below after both services finish.

### Activation checks

The API deployed commit `8ecda66` successfully in Render deployment
`dep-dbi4l10m7kps73bsls10`. Public same-origin checks returned health 200 with
database connected, anonymous developer access 401, and invalid synthetic Google
proof 401. No real user identity was submitted for these checks. All 276 local
tests passed again during activation. The temporary private PEM and service-account
JSON were removed from this workspace after storage in Render; only the public
certificate remains locally.

The website then deployed `8ecda66` successfully in
`dep-dbifhsu1egvs738ui4og` (1m19s). All four public Firebase settings were
verified in the deployed lazy JavaScript assets; the account configuration is
not expected in the initial startup chunks. The configured account chunk was
located through the deployed webpack asset map, rather than assuming Windows
local-build chunk names match Linux production names. The already-signed-in
browser session was left intact. Creator action remains: sign out when ready,
choose Continue with Google, complete Google consent, confirm the existing
Saegim password if linking, and verify saved progress. Real OAuth completion and
physical iPhone/Safari remain unverified.
