# Email reminders: prepared, sending disabled

Status: planning and message draft only. Calendar reminders are available in Settings. No email provider, mailing list, subscriber enrollment, scheduled sender, or account-email export has been created. Enabling email requires a separate implementation and release after sender setup.

## Learner experience

- Offer an unchecked email-reminder choice, separate from account creation, calendar reminders, product updates and advertising.
- Explain the destination address, frequency and local delivery time before confirmation. Verify the address through a confirmation link before activating.
- Default proposal: three chosen days per week, one reminder at most per local day. Let learners choose fewer days, pause, or turn reminders off.
- Show a preview of the next delivery in their selected IANA time zone. Recalculate for daylight-saving changes; do not infer a time zone from a server clock.
- Skip a reminder after recorded study activity that local day. An unavailable progress lookup means skip, rather than send an inaccurate streak warning.
- No guilt, loss threats, urgency, misleading mastery claims, or automatic enrollment of existing accounts.
- No tracking pixels, click tracking, or referral identifiers. Keep learning history out of message content and provider metadata.

## Sender setup before implementation

Choose a provider only after checking its current official free allowance, account eligibility, sending-domain requirements, overage behavior and unsubscribe support. Stay on a free-only configuration that stops at limits; do not add a card or permit automatic upgrades. Verify a sender/domain the owner controls and configure the provider's required authentication. The Render subdomain alone does not give the owner control of sending-domain DNS. Do not expose credentials in browser code or chat.

## Proposed implementation boundaries

Store a separate reminder preference: account ID, confirmed delivery address, consent time and copy version, active/paused status, selected weekdays, local time, IANA time zone and next delivery. Confirmation and unsubscribe secrets must be random, expire as appropriate and be stored as hashes. Deleting an account cancels pending work and removes reminder enrollment under the app's deletion policy.

A scheduled server job selects due, explicitly confirmed subscriptions. It rechecks opt-in, suppression, same-day study and daily limits immediately before sending. Use an atomic unique delivery reservation by subscription and local date to prevent duplicate sends from overlapping jobs. Never retry an ambiguous provider timeout blindly; reconcile the provider result using an idempotency mechanism first.

Unsubscribe must work without signing in, show a clear confirmation and suppress all future reminder deliveries immediately. Include a visible unsubscribe link and the provider-supported list-unsubscribe mechanism. Process verified provider bounce/complaint events into suppression. Keep operational delivery records minimal, access-restricted and bounded by a documented retention period.

Global delivery flag defaults off. Missing credentials, unverified sender, unavailable suppression/progress checks, exhausted free quota or unavailable scheduler all fail closed. Do not reuse the AI request budget for mail. Calendar reminder generation remains independent.

## Plain-text message draft

Subject: A little Korean, when you have time

Hi there,

If you have a few minutes, your next Korean lesson or review is ready.
One small practice counts. Taking a break is okay, too.

Continue learning: https://saegim.onrender.com/

You chose to receive these practice reminders.
Change your schedule: [authenticated reminder settings link]
Pause or unsubscribe: [individual unsubscribe link]

Saegim
[verified sender identification required before launch]

The bracketed values are release blockers, not values to send. Never put a recipient email in a public URL or append analytics parameters.

## Required verification before activation

Use a fake provider and synthetic accounts to prove: unchecked users receive nothing; unconfirmed and unsubscribed addresses receive nothing; completed study suppresses the day; DST and midnight boundaries follow the selected time zone; concurrent jobs reserve one delivery; paused/deleted accounts cancel work; quota exhaustion never uses paid fallback; invalid webhook signatures cannot alter subscriptions; duplicate webhooks are harmless; unsubscribe needs no account login; and message links cannot redirect to arbitrary destinations. Complete a controlled owner-approved test delivery before public enrollment. Inspect the delivered message and unsubscribe end to end.
