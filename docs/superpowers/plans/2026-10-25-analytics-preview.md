# Analytics preview implementation plan

**Goal:** Let the creator try the proposed measurements separately with synthetic data.
**Architecture:** A localhost-only, environment-gated Next route; pure aggregation helpers and interactive fixtures. No telemetry collector, database changes, monitoring jobs, provider calls or live deployment.
**Spec:** docs/analytics-expansion-design.md, narrowed by the October 25 request to test separately before adoption.

- [ ] Add failing tests for fixed event names, counters, latency distributions, cancellation handling and availability states.
- [ ] Implement the fixture model, preview route and responsive dashboard with scenario controls, per-feature filtering, clear demo labels and reset.
- [ ] Run focused/full tests and preview build; verify desktop and narrow browser layouts and click controls.
- [ ] Document evidence and limitations, save an isolated commit, and open the preview. Preserve existing unpublished feature-preview files. Do not deploy or enable collection.

Ruling: This is an interactive evaluation, not approval to enable the full collection design. User can approve the real implementation after trying it.
