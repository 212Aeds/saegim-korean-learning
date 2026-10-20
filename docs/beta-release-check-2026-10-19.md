# Beta release check — 19 October 2026

Release scope: finishing fixes, no new provider, paid feature, signup migration, database schema, email campaign, donation feature or branding change.

Fixed: modal focus trapping now considers visible, enabled, non-inert controls and includes details summaries. Focus outside an open dialog is brought back on Tab. Long authored tutor references are bounded field by field; older follow-up exchanges are dropped intact when needed instead of truncating JSON. Privacy text now covers authored lesson context/practice vocabulary and optional calendar files.

Verification: focused regressions exercise complete bounded tutor JSON with long quoted text, focus-list filtering, and the existing speech submission/goal policies. Production dependency audit (`npm audit --omit=dev`) returned zero known advisories at this check. A full dependency audit/build may still report development-tool advisories; no blind upgrades or force fixes were applied. This is not a security certification or a promise of zero bugs.

Before inviting testers tomorrow:

1. On an actual iPhone/Safari and Android/Chrome, check signup/signin, a beginner lesson, reload with retained progress, recorded Chris/Jessica playback and Stop. Test microphone permission denial as well as an opted-in recording, pause timing, transcript correction and cancellation. Also test laptop keyboard navigation. Physical-device microphone checks have not been performed by the agent.
2. Try optional conversation voice setup on the intended device. It downloads about 430 MB; device memory/storage/performance vary. Keep text conversation available. The owner laptop is not the public voice server.
3. Ask a fluent Korean reviewer to check beginner content and valid alternative answers. AI replies are practice help, not an authoritative pronunciation score or proficiency assessment.
4. Begin with a small invited cohort and watch feedback, login/progress failures and free AI limits. Free hosting can sleep and delay the first request. Do not advertise unlimited AI or instant speech generation.
5. Keep email sending and support/donation prompts off. Resolve the public brand choice and remaining name clearance before broad promotion. The candidate-name screens are preliminary.
6. If a blocking regression appears, stop new invitations and use Render's existing rollback to the last verified static deployment. Roll back the API only if the defect is in the API. These fixes do not change stored progress, so no data rollback is needed. Reproduce with synthetic text and avoid collecting private transcripts/passwords in reports.

Existing public feedback: https://forms.gle/ZwEJV2Dnzo4yEHEX9 . Do not change response access or account permissions as part of release checks.

Publishing fix: the hosted build now reuses the existing public-guide sitemap/robots generator after a successful export, defaulting to the current public origin (SAEGIM_PUBLIC_URL can override it). Crawlers are directed away from /v1/ and /api/. Only public pages enter the sitemap. Robots rules are crawler hints, not access controls. Indexing/search rank are not promised.
