# SDD ledger — plan: docs/superpowers/plans/2026-10-09-learning-pathways.md

Plan approved by user for implementation. Production Neon branch remains untouched.

Ruling: No Git metadata exists, so an isolated worktree, commit checkpoints, and git-based review packages are unavailable — proceed sequentially in the shared workspace and review the exact plan file set after each task — risk: changes are less easily reversible until project history is initialized.

Pre-flight: Task 1 produces optional `Lesson.briefing` and pathway metadata consumed by the lesson UI and Learn view. Task 2 and Task 3 extend `SavedProgress`; both must preserve unknown optional values and apply defaults when absent. Task 4 migrates `korean_words`; imports must run only on a separate Neon development branch.

Task 1: complete — lesson/pathway implementation build passed; scoped review findings fixed and re-reviewed. Live preview check deferred to a fresh final build because the currently running Next server still serves its earlier bundle.
Task 2: complete — review queue is snapshotted; speaking cursor persists by stable card ID and skips completed cards. Web build passed; read-only review found no actionable issues.
Task 3: complete — Korean-only voice selection/preview and account-backed comfort preferences/cursor persistence added; Hangul scaling and hint detail updated. API/web builds passed; two scoped review passes closed their findings. Migration 005 is unapplied.
Task 4: implementation complete — 250 new attributed entries join the 1,050-row source set; the offline dictionary fallback exposes 1,223 distinct reference headwords and 1,352 total unique local entries after starter-bank overlap. Reference-only items are visibly marked unreviewed and excluded from lessons. Migration and duplicate-safe/preserve-reviewed seed path are ready; API/web builds passed and review findings were fixed. Neon development-branch application and seed run remain pending because Neon account service is unavailable; production remains untouched.
