# Preview account availability — 2026-10-29

The creator reported an account-service problem while viewing the file-only
preview at http://127.0.0.1:3043/. Investigation found its `/api/v1/health`
returns HTTP 404 HTML: Python's static file server has no Render API rewrite.
No API was listening on local port 4004. That is distinct from the hosted API.
The live API initially timed out after 15 seconds, consistent with the existing
free-host cold-start limitation. A subsequent check returned health 200 with
database connected (336ms when warm), and a synthetic nonexistent-account login
returned the expected 401 (710ms when warm). No real credentials or learner
content were used. The creator was asked whether the reported error affected
the preview, live site or both; no answer was available during this fix.

## Decision and code

Do not proxy production authentication through a new local server, weaken Secure
cookies, change CORS, or migrate authentication to repair a file-preview problem.
`ui/preview-accounts.ts` checks only loopback hosts using the relative `/api`
configuration. Its bounded, credential-free GET recognizes a missing route or
HTML fallback. Real API configurations and production hostnames do not probe or
change behavior. A timeout alone does not disable sign-in.

`ui/account-modal.tsx` uses that result to replace a nonfunctional preview form
with an explicit link to the existing live website and a Continue in this
preview button. There is no automatic redirect or transfer of progress. Existing
guest data remains local. The unrelated no-API fallback now correctly explains
that guest practice is available, rather than claiming content is account-only.
Local previews with a working JSON health endpoint retain their normal form.

The personalized Today view's lesson, review and alternative buttons now have a
minimum height of 44px. No model, voice, speaking pace, account/progress schema,
rate limit, permission or analytics setting changed.

## Cloudflare assessment

[Turnstile's official setup guide](https://developers.cloudflare.com/turnstile/get-started/)
describes browser-generated challenge tokens plus required server verification.
It protects forms from bots; it does not supply our account database/session
service or fix a missing preview rewrite. Cloudflare One's
[identity-provider integration](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/)
is a different access-control architecture. No new provider or credentials were
enabled. Retain existing sign-in for this fix. If bot protection is selected as
a separate change, review its privacy, failure recovery, accessibility and
server-side verification requirements before rollout. Do not add a widget-only
check or promise it eliminates the free backend's cold starts.

## Evidence and limits

- 258 tests passed, including new preview detection tests and existing account
  cookie/error/cold-start request tests plus personalized recommendation tests.
- Hosted build and recorded-audio audit passed. Startup JavaScript: 355,841 gzip
  bytes, under the 360,000-byte cap. The new account module remains lazy-loaded.
- Browser: clicking Sign in on the static preview displayed the recovery notice;
  its link targeted exactly https://saegim.onrender.com/; Continue in this preview
  closed the modal. No captured browser console errors were present beforehand.
- Production health and invalid-credential checks demonstrate availability and
  rejection behavior, not successful sign-in to an actual account. Physical
  iPhone testing was not performed. A remaining live-site error would require its
  exact message or reproduction; this patch does not claim to fix an unobserved
  backend issue.

AI assisted investigation, implementation, tests and documentation. Existing
unpublished feature-preview files were left untouched. The change is reversible
by removing the preview-only helper/effect/notice and minimum-height CSS rule;
no data rollback is required.

Release verified: commit `caaa5de`, static deployment
`dep-dbhstum7bikc73fsgsag`, succeeded/live after 1m12s on existing free hosting.
Hosted startup budget passed at 357,425 gzip bytes. After deployment, the public
home returned 200, API health returned 200 with database connected, and the
anonymous developer endpoint returned 401. GitHub contains the implementation
and verification notes. No API redeploy or new Cloudflare access was necessary.
