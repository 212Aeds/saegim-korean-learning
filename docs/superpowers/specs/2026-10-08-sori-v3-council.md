# Sori V3 decision council

**Date:** 2026-10-08  
**Status:** Direction applied; production database link awaits Neon account sign-in

This is an internal decision-council synthesis, not a review by external people. The council lenses are learning science, Korean curriculum, learner/community, product design, and engineering/operations.

## Advice and decision

- **Learning-science lens:** Repeat a new item in different ways, require recall before revealing the answer, and bring it back later. Keep practice varied without treating streaks as proof of learning.
- **Korean-curriculum lens:** Separate the reference dictionary from the taught beginner path. Give every lesson item recognition, production, and a short end-of-lesson check; flag unreviewed corpus entries so they are not mistaken for edited curriculum.
- **Learner/community lens:** Require an account as requested, but keep it free, easy to leave, and clear about what progress is saved. Support learners reconnecting with Korean without assuming they all start at the same level.
- **Product-design lens:** Use a calm, visual landing page and uncluttered one-card Speak practice. Keep voice, pace, and study target available without crowding the lesson surface.
- **Engineering/operations lens:** Put accounts, progress, and dictionary data behind a real PostgreSQL connection; make schema setup repeatable and keep course content versionable. Production is not complete until the deployed API, migrations, seed, and account flows have been verified together.

**Chair decision:** Preserve the free promise and the user-approved account gate. The release candidate has 20 lessons, a 1,050-entry attributed reference bank, 100 speaking cards, per-item varied lesson practice, an end quiz, staged review, saved daily goals, and speech voice/rate controls. The corpus is explicitly labeled as CC BY-SA 3.0 adapted content and not editor-reviewed. Do not describe the content as a complete or validated Korean course yet.

## Next 16 feature ideas

1. Human-reviewed frequency-ranked beginner vocabulary with source notes.
2. Native-speaker audio recordings for letters, words, and example sentences.
3. Optional speaking recording with local self-playback and a text alternative.
4. A placement path that lets learners test out of known Hangul and grammar.
5. A Korean keyboard and syllable-block builder for mobile learners.
6. Contrastive listening for similar consonants and vowels.
7. Dictation sessions that progress from syllables to short sentences.
8. A grammar map that links patterns to every lesson and review card.
9. Personal word lists with tags and example sentences.
10. Export/import for personal decks and learner-owned study data.
11. Gentle review reminders controlled entirely by the learner.
12. Accessibility options for font size, reduced motion, and dyslexia-friendly spacing.
13. Heritage-learner tracks with family, food, and everyday conversation contexts.
14. Offline lesson packs and conflict-safe progress sync.
15. Transparent learning insights for recall accuracy by Hangul, vocabulary, and grammar.
16. Community contribution workflow with Korean-fluent review and attribution checks.

## Release checks still required

- Complete Neon authentication, link the requested project and production branch, and apply the database migration and dictionary seed.
- Verify sign-up, sign-in, progress sync, sign-out, and protected dictionary access against the live API/database.
- Review the dictionary license obligations and have Korean-fluent reviewers correct learner-facing entries and examples.
- Add account recovery, email verification, production monitoring, database backups, and deployment configuration before inviting broad public traffic.
