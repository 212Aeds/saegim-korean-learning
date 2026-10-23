# Speak card playback recovery — 2026-10-23

## What changed and why

Listen previously awaited the browser's audio.play() promise directly. A simulated pending play promise reproduced a stuck caller after Stop, startup timeout, or media error. This can leave the component in its playing state and block microphone practice. Playback startup now listens to its existing cancellation signal, removes its listener after settlement, and releases on media errors. The existing startup timeout and voice settings remain unchanged. Speak can interrupt Listen, stop that audio, and start microphone capture instead of remaining disabled during playback.

The app accepts ddal as a nonstandard typed sound cue for 딸 and displays the standard romanization ttal. A speech transcript of 달 remains distinct: it shows a specific comparison and allows retry/edit without automatically submitting a wrong result. It never changes 달 into 딸 or claims to score pronunciation. No provider, model, noise filtering, acoustic recognition settings, billing, credentials, or quotas were changed. This is an AI-assisted patch, not an acoustic-model improvement.

References: NIKL teacher material explicitly distinguishes 달 / 딸 / 탈 and their consonants: https://www.korean.go.kr/common/download.do%3Bfront%3DBFF7283ED1BA040B7FE11967D70BB304?c_file_name=11fdc7c3-af42-4d08-b772-e4157fe4f0d3_0.pdf&file_path=reportData&o_file_name=%EA%B5%AD%EC%99%B8+%ED%95%9C%EA%B5%AD%EC%96%B4+%EA%B5%90%EC%82%AC%EB%A5%BC+%EC%9C%84%ED%95%9C+%ED%95%9C%EA%B5%AD%EC%96%B4+%EA%B0%95%EC%9D%98+%EC%9E%90%EB%A3%8C%EC%A7%91-%EB%9F%AC%EC%8B%9C%EC%95%84+%EC%82%AC%ED%95%A0%EB%A6%B0+%EC%A7%80%EC%97%AD.pdf
NIKL romanization: https://www.korean.go.kr/front_eng/roman/roman_01.do

## Evidence

- Published catalog audit: all 618 URLs (309 unique Speak targets, both voices, all five levels, starting and completed pathways) returned successful audio HEAD responses. No missing clips found. This verifies availability, not listening quality.
- Local audio audit: 1,870 structurally valid recordings, including 798 blocks.
- New tests exercise every level's card playback in both voices using synthetic Audio objects and check completion. Regression tests failed before the patch for stopped startup, timed-out startup, and media-error startup; passed afterward.
- Full local suite: 217 passed (includes four existing untracked feature-preview tests; those previews are not published). Hosted production build passed.
- Browser fixture with a 390px content column: actual clicks on Listen, Speak, Stop & check, all five level selectors. Synthetic capture/transcription matched each level's target. Speak successfully interrupted intentionally stalled playback. Simulated 달 for 딸 showed the comparison and unsubmitted retry/edit controls. No physical iPhone, real microphone, or acoustic-accuracy test was performed, and no private audio or messages were sent.
- Deployment: pending.

Rollback: revert the application patch and redeploy the website while retaining patched Node 24.22.1. Accounts/progress are unaffected by this frontend patch.
