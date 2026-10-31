# Analytics reliability and layout

The existing owner dashboard remains the private entry point. Cloudflare already
contains saegim.onrender.com and received traffic. Keep the current beacon ID,
privacy opt-outs, free services, and existing data boundaries. No new collector,
API credential, DNS change, or account migration is needed.

Implementation, in the existing checkout with unrelated preview files preserved:
1. Reproduce developer/preview pages entering visitor counts; exclude these paths
   in web-analytics.ts and pass the current pathname from its client component.
2. Add a small report parser and usage summary with tests for malformed/empty
   snapshots, invalid counters and UTC reporting boundaries. Reject a bad report
   instead of rendering misleading statistics or crashing on missing usage.
3. Reorganize the private dashboard: overview totals from existing reservations,
   clear source/time labels, service checks, separate Cloudflare traffic link,
   AI allowance, collapsed history and optional experiments. Use its own styles.
4. Run focused/full tests, hosted build/startup budget, browser fixture failure
   cases and narrow-layout checks. Push only intended files; deploy using the
   existing free static service, verify health/access and the updated live UI.

Cloudflare's observed 24-hour sample during investigation: 4 visits, 6 page views,
718 ms page load, LCP p75 1,148 ms. Small sample, includes owner/testing and
developer visits before this change; not evidence of distinct people or universal
speed. Excluding internal paths affects future loads, not historical data.

AI assistance: implementation and synthetic verification. No private learner
messages, audio, account rows, or microphone are needed for testing.
