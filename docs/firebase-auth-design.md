# Optional Firebase Google sign-in

The creator selected Firebase for voluntary sign-in. Implementation choice:
Google sign-in through Firebase Authentication, alongside existing email/password
and guest practice. Use the free Spark project `saegim-35a52`; Google Analytics,
Gemini, phone/SMS authentication, billing and other Firebase products stay off.
Do not migrate existing passwords or learning data.

Approaches considered: replacing all account/session storage would risk existing
progress and require a migration. A front-end-only Firebase login would not
authenticate the existing API. Chosen approach: exchange a server-verified Google
Firebase ID token for the existing Saegim HttpOnly session. Keep Neon progress
and account IDs, current rate limits, voices and spending caps.

Use the official modular web SDK, loaded only when the sign-in dialog needs it,
and the Admin SDK on the API. Verify project, signature, expiry, revocation,
Google provider, verified email and recent authentication. Never accept a
client-supplied account ID or email as proof. A new identity gets a new local
account; an existing email requires explicit current-password confirmation before
linking. A bound provider UID subsequently selects its original account, even
if the Google display name changes. Identity mappings are added transactionally
with foreign-key cleanup; account progress is never overwritten by linking.

Plan: test identity-claim validation and linking/isolation first; implement
verifier, identity mapping migration and exchange endpoint; add a popup-based
Google control with in-memory Firebase persistence and safe cancellation/error
handling; provide password-confirmation linking; ensure account deletion cleans
the associated Firebase identity; update privacy/setup/code notes; run focused
and full tests, builds, audit and startup budget. Verify disabled configuration
preserves old sign-in and guest practice. Enable live only after project/domain,
provider and server credential configuration are complete and reviewed.

The existing account backend can still cold-start. Firebase improves sign-in
choice, not a promise of zero backend latency. Physical iPhone testing and a real
Google consent/sign-in require the creator. Never test with private credentials
or commit service-account keys. Server setup needs a dedicated service account
limited to Firebase Authentication administration for this project, stored only
in the API environment. A first live Google authorization remains a human action.

Sources: Firebase's Google web sign-in, Admin ID-token verification, session
management, user deletion, and Spark pricing guides. These will be linked with
verification evidence in the completed setup notes. AI assists implementation.
