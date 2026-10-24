# Stop letter-introduction audio when continuing

This AI-assisted reliability fix follows the new letter introductions. Clicking Practice this letter changes the visible screen without changing phase or question index. The existing audio cleanup only observed phase, index and voice, so pronunciation audio could continue over the exercise and leave its outer controls busy until playback ended.

The cleanup now also observes whether the letter introduction is visible. Dismissing it stops the previous player, invalidates its pending result, and releases the busy state. Existing question/phase/voice cleanup remains. There is no voice, pace, provider, quota, account or progress change.

The component-action regression first reproduced continuing audio, then passed after the one-dependency fix. It also verifies that a late unsuccessful playback result cannot put an audio error on the new exercise. Nine focused letter/audio/card lifecycle tests passed. Hosted build passed (352,706 gzip startup bytes locally, below budget; pre-existing untracked preview remains unpublished).

An isolated browser fixture used the real LessonModal and a synthetic indefinitely playing media object. Listen showed playing; Practice this letter changed it to stopped, and the next exercise's controls became available without a playback error. No microphone, learner data or model provider was used. This is browser/synthetic evidence, not physical iPhone validation. Browser console was clean. Deployment verification follows publication through the existing free static service.
