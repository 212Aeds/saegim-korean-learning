# Optional listen-first review

## Decision

Review already lets learners recall a meaning or write an answer. Add one optional
checkbox inside the existing review dialog to practice listening without reading
the Korean first. Keep reading as the default and avoid another homepage section.
This is a practice choice, not a proficiency test or a claim of learning benefit.
Learner feedback is still needed to establish whether it helps.

## Behavior and code map

`apps/web/app/ui/review-modal.tsx` owns the session-only mode. When enabled, the
front hides both the Korean and any question that includes it. The existing
explicit Listen button uses the selected Chris/Jessica voice and unchanged pace.
Reveal shows the Korean, original question, answer and existing reference. Ratings
still require an explicit Again/Remembered action; listening never changes progress.
Cards with no supported speech text stay readable without offering this option.
The existing prefetch is reused; no model/provider, tracking or download changes.

The same dialog had an uncaught rejected playback promise. It could leave the
button disabled on Playing. The try/catch/finally now releases that state and gives
a retry/reveal path. The existing attempt identifier prevents obsolete playback
results from overwriting a newer card's state.

## Evidence and limits

AI-assisted implementation. Synthetic component tests first reproduced the missing
control and rejected-playback bug. They check default reading, hidden target and
prompt, revealing Korean and answer, explicit ratings, unsupported cards and audio
failure recovery while preserving selected voice and pace. No microphone recording
or private learner content is used. Browser verification and release evidence are
recorded below once completed. This does not prove physical iPhone audio playback,
transcription quality or improved learning outcomes.

Verification: all 294 automated tests pass, including the three new component
regressions. The hosted build and its 1,878-clip audio audit pass. Startup
JavaScript remains 356,042 gzip bytes. In an isolated browser fixture, the toggle,
Listen, Reveal and Remembered controls were clicked; exactly one explicit rating
was recorded. A rejected synthetic playback displayed the retry notice and left
Listen enabled. The 390px-wide layout has no horizontal overflow. The fixture used
synthetic playback, not physical iPhone audio. API code and configuration did not
change. Release verification follows after deployment.
