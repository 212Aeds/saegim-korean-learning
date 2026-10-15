# Focused practice (2026-10-13)

Practice includes two focused entry points. Tricky-card practice matches the learner’s review cards marked Again against their eligible practice pool; it cannot introduce material outside that pool and stays disabled when no matching cards exist. Practice completion does not change review due dates or mark lessons complete.

Train your ear reuses existing letter listening questions and adds one Hangul dictation question for each eligible syllable, word, or phrase. Text and references stay hidden until checking; local voice audio prepares on entry. All content comes from the existing referenced curriculum. No new provider, dependency, subscription, or progress schema is required.

Round summaries show first-attempt counts by skill, optional retry of missed questions, and mascot encouragement. Hangul learners now default to letter practice.

Validation: 69 app tests and production web build pass. Browser verified level-specific choices, disabled empty recovery state, listening-round entry, hidden targets, and audio button activation. Recovery filtering, dictation eligibility/deduplication, and summary counts have focused automated tests.
# Practice round follow-up

Practice rounds deduplicate question IDs and space repeated word/letter concepts
apart when other concepts remain. Round sizes still cap at 20, and a one-concept
pool remains usable rather than dropping questions.

At the end of a round, learners can expand the questions that needed another try,
read target answers and explanations, open references, replay audio, and repeat
just those questions. This is a review of the current round, not persistent
mistake history or a replacement for scheduled Review.

Practice playback waits for the recording or device utterance to finish, exposes
Stop while playing, and stops when starting another round or leaving the results.
No new storage, account fields, provider calls, or paid service is required.
