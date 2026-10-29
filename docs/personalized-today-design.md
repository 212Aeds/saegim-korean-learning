# Personalized Today — design and implementation plan

The creator delegated feature selection, testing and simplification. Existing
placement, interests and prerequisite logic already personalize curriculum order;
Today conceals this behind multiple overlapping plans. Reuse those rules and
make the recommendation the primary action for every level. Keep the existing
three-step Hangul introduction for a brand-new learner.

Considered adding another adaptive quiz or rebuilding navigation. Both increase
scope and introduce choices before solving the immediate clutter. Chosen design:
one lesson, an explanation tied to the declared level, selected interests and
duration; a due-review option; at most two eligible alternatives in native details.
Settings remains changeable. The full dashboard is optional and reversible in
app memory per account. No new data collection, AI requests or progress writes.

Plan: write failing pure-helper tests for all five levels/eight interests,
prerequisite eligibility, advancement, no mutation and completed-route empty state;
implement a pure recommendation wrapper and a small responsive component; wire
Today and hide duplicate header prompts while focused; verify helper tests/full
suite, builds, startup budget and a synthetic guest browser walkthrough. Keep
unpublished feature-preview files untouched. Document results and limits before
shipping through existing free hosting.

Evaluation: tests can establish appropriate eligible recommendations, working
controls and less visible duplication. They cannot establish learning gains or
that real users prefer the design. Ask testers to find and start the next lesson,
change their level and find review without coaching. No attention tracking or
retention claims. AI assists implementation and evaluation; no physical-phone
test is implied by browser tests.

## Implemented and evaluated

`personalized-today.ts` wraps the existing recommendedLessons function, adds
level-specific guidance and presents only the first three eligible choices. The
primary choice remains the route's first unlocked, incomplete, non-placement
lesson. Interests influence the existing route after its required foundations;
they never bypass prerequisites. The view reads the current daily goal and warns
when the estimated lesson exceeds it instead of promising a five-minute lesson.
It does not invent mastery from a selected level. Finishing the available route
shows an empty state rather than silently restarting Hangul.

`ui/personalized-today.tsx` renders the lesson, settings link, due-review option
and collapsed alternatives. Native details/summary avoids another modal or
carousel. `page.tsx` uses it by default after the existing beginner introduction;
the full dashboard has a return button. Duplicate feedback/streak header prompts
are hidden while Today is focused. Navigation, existing lessons, microphones,
voices, AI and saved account/progress schemas are unchanged. Dashboard choice
stays in memory for the current account and resets with page reload.

Verification: 255 tests passed. Tests exercise all 40 level/interest combinations,
eight successive completions at each level, eligibility, non-mutation, completed
route behavior, due-review visibility and every focused-view callback. Hosted
build passed; startup JavaScript 355,840 gzip bytes (limit 360,000), up 1,006 bytes.
Production dependency audit reports zero findings at verification time.

Synthetic guest browser verification on loopback: basic -> Food and meals: words,
Hangul reader -> Your first readable words, intermediate -> Conversation: your
weekend, advanced -> Opinions and reasons: exchanges, new -> existing three-lesson
Hangul introduction. Settings saved and updated each recommendation. The basic
lesson opened its correct briefing; optional alternatives expanded; full Today
and the return control worked. Browser console contained no captured errors.
The test origin has no real learner data or sign-in credentials. No physical
phone test or measured learning outcome is claimed. CSS stacks review controls
and wraps the main lesson button on narrow screens, but device validation is
still needed.

Decision: keep this small slice because placement is exposed clearly and the
default Today no longer competes with several practice plans. Defer new games,
another quiz system and navigation changes. Have a beginner and experienced
learner each find/start their next lesson and locate Settings/Review without
coaching. Their task success and comments, not session length, should determine
whether to keep it. A lower visible-card count is evidence of simplification,
not proof of better learning or user preference.
