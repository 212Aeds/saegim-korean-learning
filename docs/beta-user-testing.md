# Saegim first website testing round

Test the static publishing build first. Its recorded audio, lessons, review, and
browser progress work without the laptop's model servers. Public accounts,
cloud sync, live AI, and microphone transcription are separate deployment work;
do not promise them as part of this static release.

## Small initial round

Invite 3–5 volunteers across brand-new, Hangul-reading, and basic-word levels.
Include someone comfortable reading Korean to flag language issues. Use a phone
and a desktop where possible. Ask permission before recording a testing session;
written observations are enough. Do not collect passwords or private chats.

Let each person try these tasks without coaching:

1. Choose a starting level and find the next recommended lesson. Ask what the
   app expects them to know already, and whether the recommendation fits.
2. Complete a word lesson, then find its recall lesson. Observe whether English
   meaning recall and Korean writing prompts are clearly distinguished.
3. Open Speak. Pick a word, flip it, go forward and back. Confirm one card shows.
4. Listen with Jessica and Chris; change pace, Stop, and replay. Note the exact
   word, voice, pace, browser, and symptom for clipped or delayed audio. Recorded
   voices have fixed identities; device fallback voices vary by browser.
5. Review a card, mark a difficult item Again, reload, and find it. Browser storage
   is device-specific; try a learning-data download from Account.
6. Find Settings, change level, and explain what changed. Confirm completed work
   stays saved rather than being awarded or removed by placement.
7. Open “Something feel off? Report a problem”, write a sample issue, inspect the
   preview, and download it. No public GitHub submission is needed for testing.

## Record observations

Use anonymous tester labels and record task completed / needed help / blocked,
the first confusing screen, and the exact expected vs actual behavior. Ask:
“What would you practice next?”, “What felt too easy or too hard?”, and
“What would make you come back tomorrow?” Avoid asking only whether they like it.

Fix blockers first: lost progress, incorrect accepted answers, unusable controls,
audio that cannot be stopped, or misleading level placement. Then fix repeated
confusion. Re-test the failed task after each fix. Language reports require a
contextual dictionary/editorial check; do not accept all suggested alternatives
automatically.

## Before sharing more widely

- Check the current static build on phone and desktop, keyboard-only navigation,
  reduced-motion preferences, reload persistence, and both recorded voices.
- Run `npm test`, `npm run audio:check`, and `npm run build:free`.
- Publish only the static output, with no environment files or model services.
- Configure sitemap/canonical URLs only after a real public HTTPS domain exists.
- Keep unresolved issues in a list with steps, severity, owner, and re-test result.

This document is a test plan, not evidence of completed external user testing.
