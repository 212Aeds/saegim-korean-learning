# Saegim beta expansion and speech recovery

- Added Weather and Seasons and Shopping Essentials: 12 vocabulary senses, eight lessons across words, recall, exchanges, and consolidation, plus two tutor situations. Existing prerequisites and placement still apply.
- Dictionary senses checked against the pinned cc-kedict source. Regenerated references using checksum verification; synchronized the reference input list with every current journey topic so rebuilding no longer drops older headwords. Examples remain app-authored and pending editorial review.
- Phrase recording defaults to a 1.3-second silence gap, with explicit 0.9-second Quick and 2.2-second Unhurried choices. This reduces only the local silence wait; it does not promise faster inference or pronunciation assessment.
- Re-arm the four-second missing-audio watchdog after every frame so a stalled phone/Bluetooth stream releases the microphone promptly. Regression first failed, then passed with cleanup assertions.
- Common exact polite-greeting questions use an authored, sourced answer without inference or quota, like the existing narrow Hangul composition route. Other questions and conversation turns still use Qwen. No model, provider, billing, or security permissions changed.
- Sources: https://github.com/mhagiwara/cc-kedict/tree/625a7556e7579d415727358d5b6e873aa5a50338 ; https://krdict.korean.go.kr/eng/dicMarinerSearch/search?mainSearchWord=안녕하다
- A four-hour thread heartbeat was configured to continue bounded, verified improvements within the free-only constraints. This is a local Codex follow-up, not an always-on hosted development worker.
