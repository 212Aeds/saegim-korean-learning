# Speech and recorded audio wait reduction

Two client-side queues caused unnecessary waiting: every remounted speaking card issued a fresh speech status request, and recorded clip preparation waited behind every unrelated in-flight clip.

Availability checks now share one in-flight request and reuse successful results for 15 seconds within the tab. Failures are not cached. Explicit Retry bypasses the successful cache. Transcription remains authenticated, consented, quota-limited and never automatically retried. A cached readiness result cannot grant API access.

Recorded lesson clips now prepare independently of unrelated downloads. Local synthesis retains the existing serialization to avoid increasing model work. Chris/Jessica identity, weights, recording pauses, transcription providers, caps and budgets are unchanged.

## Evidence
- Synthetic checks confirm two concurrent readiness callers make one request; cache expiry and explicit retry work, and a failed status is immediately retryable.
- With an intentionally unresolved first recorded-file response, a second recorded file begins fetching and finishes independently. Only synthetic response bytes are used, with no microphone or private recordings.
- 157 tests passed; hosted production build/typecheck and startup budget passed (354,584 gzip bytes locally). All 1,166 catalog audio clips verified.
- Live public API/database health returned HTTP 200, status ok, database connected in one 1.42-second request. One sample does not establish typical, cold-start or AI inference latency.

Free hosting may sleep, provider latency varies, and actual phone microphone/human listening validation is not claimed. No paid service, keep-alive polling, credential change, dependency upgrade or provider/model change was introduced.
