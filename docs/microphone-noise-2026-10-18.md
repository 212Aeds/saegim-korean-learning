# Microphone noise and endpoint tuning

The browser already requested echo cancellation, noise suppression, and automatic gain control. Plain boolean constraints are best-effort and unsupported settings are ignored (MDN MediaTrackConstraints/noiseSuppression). Preserve that compatible request rather than requiring browser-specific support.

Capture now measures a short ambient baseline before announcing Listening. An 80 Hz high-pass filter reduces low-frequency rumble in the PCM supplied to transcription; a threshold relative to the ambient baseline and minimum sustained sample activity avoid treating steady noise or isolated clicks as speech. Audio is not hard-gated on/off, preserving quiet consonants and word endings. This is lightweight activity detection, not speaker identification, source separation, or a pronunciation assessment; background speech and changing noise remain limitations.

Phrase pause choices are explicit 1, 2, and 3 seconds, default 2 seconds. Recording clamps callers to that range. Conversation pauses are 3/2.5/2.2/1.8/1.5 seconds from new through advanced. The pause starts after qualifying speech and resets when speech resumes. A visible pause countdown and manual Stop & check make automatic submission understandable. Transcription starts immediately after capture finishes; this does not promise instantaneous recognition or eliminate free-host cold starts.

Tests use synthetic audio, quiet speech-like tones, noise, clicks, and interrupted audio; no personal microphone audio is captured. Physical phone and laptop microphone testing remains needed.
