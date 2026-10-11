# Task 3 implementation report — contextual tutor panel

Implemented the optional tutor panel in the active lesson question and speaking card. Each panel shows a curated hint, explains OpenAI text processing and possible 30-day abuse-monitoring retention, and requires affirmative consent before its first POST. The client sends only the current question, lesson/card ID, bounded context, and consent. Questions, answers, and consent remain in component memory. Closing, changing cards/questions, withdrawing consent, or editing a pending question aborts or ignores the previous request. Controlled messages cover unavailable, daily limit, and error responses; the curated hint remains available.

The speaking card completion state now stays visible for 400 ms under reduced motion, while CSS still suppresses decorative animation. Its timer is cleared on card change or component unmount.

**Verification:** `npm --workspace @sori/web run build -- --webpack` passed. `git diff --check` passed. No automated tests, provider calls, database connections, or migrations were run. Live tutor responses and manual browser interaction remain unverified without provider setup.

**Changed code:** `apps/web/app/ui/tutor-panel.tsx`, `apps/web/app/ui/lesson-modal.tsx`, `apps/web/app/ui/speak-deck.tsx`, `apps/web/app/styles.css`.
