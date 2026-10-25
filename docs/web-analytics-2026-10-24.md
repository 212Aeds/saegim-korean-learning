# Free aggregate website analytics

The creator explicitly authorized Cloudflare Web Analytics and a GitHub update on October 24, 2026. This AI-assisted integration answers: are visits arriving, which referral websites bring traffic, and how does page loading perform? It does not measure individual lesson activity, optimize time spent, or record learner input.

## Implementation and data boundaries

Created the free Web Analytics site for saegim.onrender.com in the existing Cloudflare account. No DNS, proxy, paid plan, credentials, API permissions, AI provider, quota, account or progress changes were needed. The beacon token in web-analytics.ts is a public installation identifier, not a secret API token.

RootLayout mounts a client component after hydration. A small installer appends Cloudflare's official module script asynchronously once, only on the exact production hostname. It skips localhost, preview/lookalike hosts, Do Not Track, and Global Privacy Control. The supported spa:false option disables automatic in-app navigation measurement. No custom events, account IDs, form values, lesson answers, chat messages, or recordings are supplied to analytics. The script is optional to learning; loading failure must not block the app. The privacy notice now explains aggregate metrics, ordinary connection information, provider links and privacy-signal opt-outs, replacing the obsolete claim that no analytics exists.

Cloudflare's beacon handles page/performance metadata and requests go to Cloudflare. This is not a claim that third-party code cannot access the page or that all connection processing is anonymous. Do not put names, email addresses, authentication material, or other private information in promotional URLs. The application currently uses hash-based learning sections; these are not counted as separate lesson events by this integration.

## Reading results

Cloudflare dashboard → Observability → Web Analytics → saegim.onrender.com. Use Visits and Page views, referral hosts, device/browser filters and performance. Visits are not distinct people. Blocking and privacy opt-outs can undercount; visits by the creator/tester can count. Counts begin at installation, not retroactively. Referrers may be missing in messaging apps or privacy-restricting browsers. Compare dated promotion efforts with traffic and voluntary feedback; do not equate traffic with learning or retention.

## Official sources checked

- https://developers.cloudflare.com/web-analytics/get-started/ — manual snippet for an externally hosted hostname.
- https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/ — spa:false configuration.
- https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/ — script and collection endpoints.
- https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/ — visit/page view definitions.
- https://nextjs.org/docs/app/api-reference/directives/use-client — client boundary for browser APIs.

## Verification

231 local tests passed, including the pre-existing unpublished preview tests. New tests verify a single script, exact hostname restriction, privacy signals, spa:false, and no custom event fields. Hosted build passed at 353,339 gzip startup bytes locally, below the existing budget. No microphone or private learner data was used. Production deployment and receipt verification are recorded after publication.

Rollback: remove CloudflareAnalytics from RootLayout (or remove the beacon installer), rebuild and deploy. Existing analytics data is managed in Cloudflare; removing the script prevents new collection. No database migration is involved.
