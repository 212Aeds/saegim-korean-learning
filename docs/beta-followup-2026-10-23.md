# Beta follow-up hardening — 2026-10-23

AI-assisted implementation and evidence. No paid usage, credentials, accounts, progress, model, voice, speech rate, or quotas changed.

## Conversation teaching accuracy

Reproduced the observed unsupported rule (ranking 좋아하는 as more formal than 좋아해요) with a synthetic provider response. TutorService now keeps AI dialogue and translation but supplies the separate practice note from authored, level-appropriate guidance. The liking form note is backed by NIKL examples and links to the source. Other notes encourage manageable responses or editable reply suggestions instead of inventing grammatical corrections or pronunciation verdicts. This deliberately trades generated correction detail for reliable practice guidance. The conversation itself and translations remain generated and can still be imperfect; this is not a universal correctness guarantee.

The narrow Q&A comparing these two forms now has a sourced answer without an inference request. Regression tests verify the known false tip cannot pass through, dialogue stays unchanged, and general Q&A remains independent.

Source: https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=27929&nation=eng

## Safari suspension recovery

The conversation previously had no page-suspension handler. Added visibilitychange/pagehide cleanup: pause voice capture/playback, release UI controls, retain messages, and require a user action to restart. A reply completing while hidden does not trigger read-aloud. Existing voices and pace remain unchanged.

Synthetic browser fixture: started a voice turn, held mock playback pending, clicked a pagehide simulation, observed enabled replay/start controls and preserved messages, restarted with the prior history, and ended successfully. No console errors. Unit test covers hidden/visible/pagehide transitions and listener cleanup. These are not actual Safari or microphone tests.

Windows detects an Apple Mobile Device USB Composite Device, but available computer-use surfaces expose only desktop in-app browser tabs. User reports iPhone 14/15 Pro, Safari. Apple documents Safari remote inspection through a connected Mac: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios . No access permissions changed, no third-party USB bridge installed, no real microphone recorded.

## Development dependency fixes

Neon 8.3.4 pins vulnerable development-only transitive versions. Scoped overrides preserve Neon 8.3.4 while patching @hono/node-server 2.0.4 -> 2.0.10 and diff 5.2.0 -> 5.2.2. Verified upstream advisories first:
https://github.com/honojs/node-server/security/advisories/GHSA-9mqv-5hh9-4cgg
https://github.com/kpdecker/jsdiff/security/advisories/GHSA-73rr-hh4g-fpgx

npm audit now reports zero known vulnerabilities. Neon --version still returns 8.3.4; no Neon deploy or database migration ran. Only two lockfile package entries changed. Remove the overrides when a future reviewed Neon release includes these fixes.

## Verification and remaining limits

220 local tests passed, including four pre-existing untracked preview tests that are not published. API and hosted website builds passed. Paid providers remain disabled. Deployment pending.

No measured acoustic-recognition or TTS-speed improvement claimed. The previous short-word comparison/retry protections remain. Free Render's idle spin-down and novel browser speech synthesis still take time. No artificial keep-alive traffic or paid hosting enabled.

Physical iPhone check after deployment: refresh Safari; Listen and then Speak/Stop on a short word; start a voice conversation and background Safari; return and verify the messages remain, replay works, and Start voice conversation restarts. Test Wi-Fi and cellular manually when available. Use the normal feedback form to report failures; the app does not collect microphone tests or telemetry automatically.
