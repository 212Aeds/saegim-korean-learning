# Phone microphone, sounds, and motion — 2026-10-18

The shared recorder now captures at the hardware's native sample rate and keeps
16 kHz normalization at the encoding boundary. Soft-input detection uses a lower
energy floor, requires sustained input, displays a visible soft-input meter,
and applies bounded gain. Digital silence is still rejected. A four-second
watchdog distinguishes an opened microphone with no audio frames from a quiet
room and releases capture with actionable guidance. Phrase practice includes
permission, system-input, and Bluetooth troubleshooting.

Practice chimes can be unlocked by the initial speaking tap and wait for audio
resume before scheduling notes. Enabling practice sounds previews the chime;
correct standalone speaking answers now chime as well. Lesson callbacks retain
their existing chime without duplicating it. Mute and blocked-audio handling
remain supported. Landing motion adds short entrances, CTA/phrase-card feedback,
and a gentle decorative drift only when reduced motion is not requested.

Google verification: aeden.gray2@gmail.com is already the form owner and has
access to its linked private response sheet. Both files were starred in Drive
for easier access. New-response email notifications were verified enabled.
No public response sharing or new external editor was added.

Regression coverage includes native-rate soft speech, silent input rejection,
no-frame watchdog cleanup, phone chime resume, prior cancellation/late-stream
cleanup, WAV normalization, and playback ordering. 115 tests passed. Physical
phone microphones, Bluetooth routing, noisy rooms, and real accents still need
user beta testing; simulated input and viewport checks do not prove those cases.
