# Native practice sound recovery — 2026-10-23

The learner reported that repeated iPhone practice sounds still failed and conversation audio remained delayed after the previous patch. Prior desktop checks did not establish a successful iPhone fix. This AI-assisted follow-up changes the sound implementation rather than adding another AudioContext resume call.

## Native feedback audio

Replaced oscillator/AudioContext dings with one reusable native HTMLAudioElement and an app-generated 0.37-second WAV (same two ascending frequencies, about 18 KB). The file preloads on page mount without playing. It does not maintain a Web Audio graph across microphone sessions. Correct-result taps reuse/reset the same element; failed play promises do not block future attempts. Microphone taps prime that element with silent audio; version checks prevent late priming from pausing a newer ding. The learner's mute preference remains authoritative.

Playback rejection now changes the existing sound toggle to Tap to enable practice sounds. A direct retry restores it to on after playback succeeds, rather than muting the already enabled preference. No native playback bar, telemetry, microphone capture, provider request, or extra permission is added.

WebKit explains per-element autoplay permission and source reuse (macOS guidance, not a guarantee of iPhone behavior): https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/

Tests simulate a permanently pending Web Audio resume while native playback proceeds, rejected play followed by retry, rapid repeated taps, muted preference, stale priming completion, and silent preloading. A PCM spectral check verifies the saved clip retains the ascending tones. Updated old tests that depended on oscillator implementation to verify the recording/native behavior instead.

Actual desktop browser: one priming tap plus twelve correct-ding taps produced thirteen successful playback starts and zero playback errors. Separate synthetic rejection fixture: control changed to Tap to enable practice sounds; clearing simulated rejection and tapping it played the real clip and restored on. No actual iPhone/microphone test was performed by the agent.

## Conversation startup

Measured the existing browser engine with synthetic Korean, same Jessica preset, 8 steps, base speed 0.9: in one warmed desktop comparison, 50 characters generated in 8,181 ms, the 24-character first sentence in 3,789 ms, and an 11-character independent sentence in 2,397 ms. These are different texts in a single run, not a controlled end-to-end application speedup or a phone benchmark. The earlier prepared-opening change could not remove synthesis cost for arbitrary first sentences.

Conversation policy now prefers a short, meaningful independent first sentence (roughly 10–18 Korean characters where natural), with detail and the follow-up in later sentences. Existing level guidance and conversational substance remain; filler/greeting padding and word splitting are prohibited. This is a model instruction, not an enforced guarantee about every generated reply. Speech pace, model, inference steps, voice presets, and user rate are unchanged. Prepared opening audio can now prefetch before inference-model readiness; this does not initialize inference or call a provider.

## Verification and limits

226 local tests passed; four existing untracked preview tests remain unpublished. API and hosted web builds passed. No paid configuration, credentials, quotas, authentication, accounts, or progress changed. Deployed commit 0f4eb56 to the existing free API (dep-dbdhnnjrjlhs73db9f90) and static site (dep-dbdhnntg1s2s73bi1rl0). Both Render builds succeeded on Node 24.22.1. Public and direct API health returned 200 with the database connected. The deployed correct.wav matches the local SHA-256 (65134E8522A4CA567CBA39575B7DD13128F8A9CD9DCE29BFDA67A34B1990704E). The iPhone outcome remains unconfirmed; generation delay can still occur on the current free on-device engine. Test fixtures and timing outputs remain ignored.
