# Free Korean Learning App — Product Design

**Date:** 2026-10-08  
**Status:** Proposed; awaiting user review  
**Product type:** Responsive web app, designed for mobile first

## Product brief

Build a free Korean-learning app for the creator and other young learners, including Korean Americans interested in learning or reconnecting with Korean. The first release teaches absolute beginners to read Hangul, recognize and use useful vocabulary, understand basic grammar, and speak simple Korean. It should feel polished, lively, and approachable, taking KORI as a visual reference while using original branding, layouts, copy, and artwork.

The product promise is that the complete beginner course, review system, and guided speaking practice remain free to use. The app earns trust by helping learners remember and use Korean, rather than by maximizing lesson count, streak pressure, or time spent in the app.

## Audience and outcomes

### Primary learner

An English-speaking beginner who wants to start reading, understanding, and speaking everyday Korean. The initial path assumes no Hangul knowledge and should not require a learner to identify as Korean or have heritage-language experience.

### Additional learners

Young learners and Korean Americans with varying exposure to Korean may use the app. The first release should avoid assuming that cultural identity predicts proficiency. A future placement or skip-ahead path can address learners who already know some material.

### Learner outcome

After completing the beginner path, a learner should be able to:

- identify and combine core Hangul consonants and vowels, then decode beginner syllables and words;
- understand and recall a useful beginner vocabulary set in listening and reading;
- recognize and use a small set of high-frequency sentence patterns and basic grammar;
- produce and understand short everyday utterances, including a simple self-introduction;
- review previously learned material using a schedule that brings it back over time.

The initial course content and target vocabulary count must be set during implementation planning, after lesson-writing capacity is assessed. The app must not claim a fluency level or outcome it has not validated.

## Learning experience

### Core loop

Every lesson uses a short, repeatable sequence:

1. **Notice:** Present a sound, Hangul form, word, or sentence in a meaningful context. Pair Korean text with audio and a concise explanation.
2. **Retrieve:** Ask the learner to recall or recognize the item before revealing the answer. Include listening-to-meaning, meaning-to-Korean, and form-to-sound directions over time.
3. **Use:** Have the learner build a syllable or sentence, choose a fitting phrase, or respond to a guided speaking prompt.
4. **Feedback:** Explain why an answer works, show a correction when needed, and let the learner retry without losing access or progress.
5. **Return:** Schedule learned items for later review. Make recall success and learner difficulty inform the next review interval. Keep the algorithm simple and inspectable in the first release.

Spacing and retrieval practice are the foundational memory strategies. Use varied prompts and interleave recently learned material with older material when appropriate. Mnemonics, imagery, and contextual examples may support individual lessons, but should be used as aids rather than presented as guaranteed psychological effects. Give the learner a way to flag an item as difficult and revisit it.

### Curriculum structure

The first release is one connected beginner course with four strands:

- **Hangul:** letter-sound mapping, syllable blocks, listening discrimination, reading practice, and beginner sound-change awareness only when it supports the current lesson.
- **Vocabulary:** useful words organized by situations and concepts, introduced in phrases as well as individually, with audio and review prompts.
- **Grammar:** a small, sequenced set of sentence patterns; explain form and use through plain English, examples, and meaningful contrast.
- **Speaking and listening:** model audio, short comprehension prompts, guided response construction, and optional recording for self-comparison. Open-ended AI conversation is not required for launch.

Each unit combines strands so learners apply letters, words, and grammar instead of completing disconnected modules. The first vertical slice should end in a useful spoken outcome, such as a brief greeting and self-introduction.

### Motivation and feedback

Show a clear next lesson, due reviews, and a progress map of skills learned. Use optional milestones and gentle encouragement. Do not use lost streaks, artificial scarcity, competitive rankings, or punitive failure states as the primary retention strategy. Let learners control audio playback and replay examples freely.

## Visual and interaction direction

- Mobile-first, responsive layouts; desktop should remain comfortable for longer study.
- A warm, high-energy identity with confident typography, readable Hangul, expressive original illustrations, and a small number of strong accent colors.
- Prioritize legibility, generous spacing, clear audio controls, and accessible contrast over decorative density.
- Use motion sparingly to reinforce syllable formation, answer feedback, and progress. Respect reduced-motion settings.
- Keep the key lesson controls keyboard accessible, provide visible focus, label audio actions, and avoid conveying correctness through color alone.
- Use KORI only as a reference for the desired approachable and polished feeling. Do not reproduce its name, mascot, artwork, screen composition, or proprietary assets.

The exact brand name, color tokens, typography, and illustration style remain open for a visual-design pass during implementation planning.

## Free-access policy

The first release has no paid tier, subscription, energy limit, or feature gate. Hangul, the beginner course, vocabulary review, grammar practice, speaking prompts, progress tracking, and learner data export/deletion must be available without payment. Do not make AI voice features a dependency of the free speaking path.

If the project later needs funding, evaluate optional donations, grants, sponsorships, or institutional partnerships without removing core learning features behind payment. Funding and operating-cost assumptions are not yet established and must be researched before launch commitments.

## Product surfaces

1. **Welcome and goal setup:** Explain the free promise; let the learner select a light daily goal and whether they are new to Hangul. No account is required before trying the first lesson.
2. **Today:** Resume the course, see a small count of due reviews, and view progress toward the current unit.
3. **Course path:** Show sequenced units and unlocked next steps; allow review of completed lessons without penalty.
4. **Lesson player:** Combine audio, Hangul display, translation/explanation, response input, feedback, and progress in a consistent mobile-first flow.
5. **Review:** Offer short retrieval sessions from due items across vocabulary, Hangul, and grammar. Explain an answer after each attempt.
6. **Speaking practice:** Start with modeled phrases, guided prompts, record/replay, and learner-controlled self-checks. Browser and device permission failures must not prevent completion through a text or listening alternative.
7. **Progress and settings:** Show unit and skill progress, review history, audio speed where available, reduced motion, account/data controls, and daily-goal settings.

## Technical direction

Use a web-first architecture:

- **Frontend:** Next.js with TypeScript, responsive server-rendered application shell, and focused client-side lesson interactions.
- **Backend:** NestJS with TypeScript for modular APIs and domain logic.
- **Database:** PostgreSQL for accounts, curriculum, lesson attempts, review scheduling, and progress. Keep curriculum content portable and versionable; choose a content authoring representation during planning.
- **Audio:** Store or serve licensed/created audio through a production-ready object-storage/CDN path selected in the implementation plan. Track source and usage rights for each asset.
- **Authentication:** Allow anonymous trial lessons. Add account creation when learners want synchronized progress; provide a low-friction, secure sign-in approach during implementation planning.
- **Deployment:** Select hosting and production operations based on budget, region, data handling, backups, monitoring, and expected traffic. No vendor is selected in this product design.

Do not begin with microservices, a vector database, a social graph, an AI tutor dependency, or a recommendation engine. Keep lesson progression and review logic behind clear server-side interfaces so the system can evolve without moving the curriculum into a complex architecture.

## Data and privacy principles

Collect only information needed to provide accounts, save learning progress, and understand aggregate product health. Speaking recordings are optional; do not retain recordings by default. Clearly explain any microphone use before requesting permission. Provide account deletion and a way to remove learner data. Do not collect a learner's age unless required for a specific, reviewed product need. Do not launch community features or public profiles in the first release.

Before launch, review applicable privacy, accessibility, child-safety, and platform requirements for the actual audience, jurisdictions, and distribution channels. The initial design does not make a legal compliance determination.

## Measurement

Measure whether the app supports learning and return use, not raw time spent. Initial product measures:

- lesson completion and where learners abandon the first beginner path;
- next-day and later review return rate;
- recall success by item and prompt direction;
- completion of a guided speaking task, including the non-recording alternative;
- learner-reported confidence and perceived usefulness after a unit;
- performance differences between first attempts and delayed review attempts.

Set numeric launch targets after the first usability sessions establish a baseline. Do not treat streaks, session length, or notifications opened as proof of learning.

## First-release scope

### Included

- One complete, structured beginner course spanning Hangul, vocabulary, basic grammar, listening, and guided speaking.
- A spaced review queue covering items taught in the course.
- Lesson progress, resuming, and optional account-based synchronization.
- Audio examples and a speaking path that works without AI and without retaining recordings.
- Original visual identity and responsive, accessible UI.
- Basic product analytics focused on learning outcomes and usability.

### Excluded from the first release

- Open-ended AI conversation or pronunciation scoring.
- Video feed, social network, leaderboards, leagues, public profiles, or user-generated lessons.
- Multiple proficiency tracks, large localization program, offline sync, or native mobile apps.
- Paid plans, advertising, and paywalled curriculum.

These exclusions may be reconsidered after the beginner path demonstrates completion, delayed recall, and repeat use.

## Risks and responses

| Risk | Response |
|---|---|
| Course breadth overwhelms solo content production | Write and validate one end-to-end unit before expanding the course; use a defined lesson template. |
| Attractive UI masks weak learning | Test delayed recall and learner application, not only lesson completion or visual preference. |
| “Free” cannot be sustained | Estimate hosting, audio, content, and support costs before launch; investigate non-paywall funding options. |
| Speaking is blocked by microphone/browser limits | Make listen, construct, and text-response alternatives first-class completion paths. |
| Heritage learners feel miscategorized | Do not infer proficiency from identity; allow review and later placement options. |
| Third-party assets lack usage rights | Track rights and provenance for audio, fonts, and visual assets before publishing. |

## Validation before broad launch

Prototype one end-to-end beginner path that teaches a small Hangul set, a few words, one sentence pattern, and one guided spoken outcome. Test it with five intended learners. Observe completion and confusion; the next day, ask learners to recall and use the material without hints. These sessions are qualitative usability checks, not evidence of market size or statistically reliable learning impact.

Use findings to revise instructions, prompts, accessibility, and sequence before filling out the first course. Then validate the course as a whole with a small invited cohort and set explicit launch criteria for delayed recall, completion, repeat use, accessibility, and operational readiness.

## Open decisions for implementation planning

- Final product name and visual identity.
- Exact beginner curriculum length and content-authoring format.
- Whether initial progress synchronization uses email login, passkeys, or another method.
- Hosting, object storage, analytics provider, and expected operating budget.
- Audio sourcing and licensing plan, including any native-speaker review process.
- Launch target, definition of “a lot of users,” and numeric success thresholds.
- Detailed security, privacy, accessibility, and production-readiness requirements for selected launch regions.
