# Request parser dependency patch — 2026-10-28

The away-time check found four high and one moderate production dependency
findings. A malformed compressed JSON request can crash an affected body-parser
process before authentication. This is a reliability concern for sign-in and
other JSON endpoints, even though no evidence of exploitation was found.

Updated the existing Nest Express adapter from 12.1.2 to 12.3.2 within major 12,
whose declared peer dependencies accept the existing Nest core/common 12.1.2.
The supported adapter brings Express 5.3.0 and Multer 2.5.0. The lockfile now
resolves body-parser 2.4.0, qs 6.17.0 and Zod 4.6.6. Zod's API minimum is raised
to the patched version. No forced fix, provider/model update, authentication
change, request-size change, voice change or speaking-speed change was made.

## Sources reviewed

- [Nest adapter release](https://github.com/nestjs/nest/releases/tag/v12.3.2)
- [body-parser compressed-body crash](https://github.com/advisories/GHSA-27r3-jxmh-p828)
- [Multer asynchronous fileFilter crash](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)
- [qs stringify failure](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw)
- [Zod validation memory use](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)

Package metadata and lockfile changes were reviewed rather than applying a broad
audit fix. Express's updated content-type/disposition dependencies are part of
the upstream adapter update. Multer's advisory requires a pending asynchronous
fileFilter; our bounded raw speech upload is a different code path.

## Verification

- Existing baseline: 250 tests passed and API build passed.
- After patch: 251 tests passed, API build passed, hosted static build passed.
- New synthetic loopback test: valid gzip JSON parses; malformed trailing bytes
  return a client error; the disposable child process remains alive and serves a
  subsequent health request. This test was added after dependency installation;
  it does not claim a reproduced crash on the prior version.
- Exported startup JavaScript: 354,834 gzip bytes, below the 360,000-byte limit.
- `npm audit --omit=dev`: zero reported vulnerabilities at verification time.
- Full audit still reports development-only findings: Undici through the Neon
  CLI (high), fast-uri (moderate), and three low direct/transitive reports through
  Nest CLI/deepmerge. These remain follow-up work; this is not an all-clear for
  every development tool or a guarantee of zero bugs.

AI assisted the investigation, dependency selection, synthetic test and this
note. No learner content or microphone input was used. The website UI and its
working voices remain unchanged. Physical iPhone behavior was not tested.

## Deployment and rollback

Deploy only the API through its existing free Render service after local checks.
Verify the deployed commit, health/database connectivity and anonymous rejection
of the private developer endpoint. The static build was verified for dependency
compatibility; no frontend change requires a new static deployment.

If runtime incompatibility appears, use Render's prior successful API deploy as
an emergency rollback, then investigate promptly: the prior dependency set has
known advisories. Avoid reverting application data or account progress.
