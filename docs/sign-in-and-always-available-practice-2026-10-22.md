# Sign-in and always-available conversation practice - 2026-10-22

The prior patch only made daily-limit errors clearer; it did not make practice available. This change supplies a bounded app-authored alternative and retains explicit access to open-ended AI. No provider, quota, billing or authentication migration changes.

## Sign-in

Previously the browser sent login, then requested progress. That second endpoint looked up the session before reading progress, blocking entry to the app. Successful login now includes learningProgress after password verification and session creation, using the same progress reader. This removes one browser/server round trip and the duplicate session lookup on this flow. The login response is private/no-store. Invalid credentials cannot read progress. Existing clients can ignore the extra field; new clients fall back to the progress endpoint with an older server. The snapshot is removed from the account object before saving account state. New accounts without progress retain the existing initialization path. The account dialog module is prepared shortly after the public page becomes ready.

These changes remove avoidable work, not the hosting cold start. No credentials, session rules, password hashing or existing progress were changed. Physical-device and cold-start timings are not claimed.

## Conversation

All fifteen green starter options now open a local guided exchange immediately. Each has two learner turns, English meanings, romanization and dictionary references. Routes differ by placement, with shorter beginner exchanges and opinion/reason practice at higher levels. These are app-authored scripts, not generated AI, fluency assessment or automatic free-text grading. The UI labels the distinction and offers Use AI for open-ended chat. Unrecognized free-text in guided mode gets guidance rather than an invented evaluation.

A text AI request returning 429 or 503 offers guided practice with an explicit notice that it has not answered/evaluated the last message. Guided choices and reply help use no AI requests. Voice calls cannot continue a failed AI session by repeatedly uploading audio; they stop with guidance toward the local starter flow. Voice conversation still uses the existing speech/AI services and caps. All guided partner lines have existing recordings in both Chris/Jessica voices, so they need no model synthesis or download. Novel AI replies still use the existing browser voice engine. Korean examples remain app-authored and pending editorial review; references are available in the UI.

## Evidence and limits

196 automated tests passed on the final change, together with both API and hosted production builds. The recorded-audio audit passed for 1,870 clips. The exported initial JavaScript measured 351,844 gzip bytes locally; this is not a device load-time benchmark. New tests exercise successful login with a synthetic scrypt credential and account-specific progress, deny progress to an incorrect password, check every starter/step for both recorded voices, and verify no provider request occurs in starter code. Browser checks used the actual components: all three basic starters worked against a synthetic 429 endpoint, a full two-answer exchange completed with the request counter at zero, and an open-ended failure returned to usable guided choices. The sign-in form accepted only synthetic fixture credentials and displayed bundled progress with one request. No real learner prompt or microphone was used. This is not an unlimited AI service or physical iPhone verification. AI assistance was used for implementation and tests.
