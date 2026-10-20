# Guest access and first-visit responsiveness

## Problem and decisions
The public landing page previously waited for /auth/me and, when signed in, /progress/me before becoming available. Free-host wake-up could therefore prevent a first-time visitor from using even the public page. Local state now restores first, public content becomes ready, and account restoration continues in the background with a bounded session read. A restore version prevents a late response from replacing a learner who chose guest access or signed in explicitly. Account progress is fetched before making the account active; failed reads do not trigger an overwrite.

Visitors can choose Start learning — no email needed, complete the existing level/goals/time onboarding, and use lessons, cards, review, listening and written recall. The same device-only profile/progress keys from the free publishing mode are reused, separately from account storage. Guests never use the debounced account progress writer. AI and remote speech recognition continue requiring an optional account under existing free usage limits; guest speaking practice uses recorded listening and written answers. No anonymous inference endpoint or new abuse surface was opened.

An optional signup/sign-in is available without abandoning the guest session first. Existing account progress takes precedence. Only an account without saved progress inherits the current guest progress. Guest browser data remains separate. Settings, export and clearing guest data use the existing local paths. Clearing site data and private browsing can erase progress; this is explained on the site. No new analytics, attention tracking, advertising, email enrollment, billing, permissions or authentication migration.

## Evidence
- 155 automated tests passed, including guest storage/API boundaries, first-ready ordering, stale response checks, optional authentication and settings/onboarding paths.
- Hosted web production export and API build passed; 1,166 audio clips verified (239.4 MiB).
- Synthetic local server delayed account restoration for 12 seconds: public homepage was visibly available during the delay.
- Browser checks: no-email onboarding, level-appropriate first path, optional email signup form, guest written ㄱ / g answer, recorded practice activity surviving reload.
- Guest activity changed only isolated localhost data; no real account progress or microphone recording used.

This proves removal of the blocking account wait, not a measured production speedup or a physical mobile performance claim. Other downloads, JavaScript initialization and network conditions can still affect first paint. No zero-bug guarantee. Real phone testing and native Korean editorial review remain needed.

## Rollback
Use the existing Render static-site rollback to the prior verified deploy. No database schema or credential change is involved. Guest data remains under its separate local keys.
