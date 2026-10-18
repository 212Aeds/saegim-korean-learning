# Speaking reliability and phone beta pass — 2026-10-17

## Changes

- Phrase practice uses the shared bounded PCM recorder instead of MediaRecorder container capture and browser decode. Both phrases and conversations produce mono 16 kHz WAV, including fallback hardware rates of 44.1/48 kHz.
- Cancel settles an unanswered permission request immediately, releases a stream granted later, cancels transcription, and ignores stale results. Permission requests time out after 30 seconds. Changing the target or leaving phrase practice also cancels its attempt. Hiding the page pauses phrase practice rather than uploading a partial attempt.
- Phrase recording stops after a pause, stops an empty attempt without uploading it, and offers explicit Stop & check. Recording and pending requests have a Cancel action. Microphone permission/device errors have actionable messages.
- Saved audio starts directly from its trusted packaged URL inside the tap gesture. It no longer waits for a fetch/blob round trip before calling play. Local synthesis still uses its prepared audio cache. Paid fallbacks remain disabled.
- Phone controls have larger touch targets, more compact feedback banners, safe-area bottom spacing, a sticky header, readable input sizing, and clearer recording state and elapsed time. Lesson speaking avoids a duplicate Listen control.

## Evidence and limits

- Focused regressions cover hardware-rate conversion/duration, cancellation before permission resolves, late-stream cleanup, unsupported sample-rate fallback, gesture-time playback, and existing stop/playback ordering.
- 111 tests passed. Hosted production build passed.
- The real hosted transcription endpoint recognized a saved Chris greeting processed through the updated encoder as `안녕하세요.` at 16 kHz. A synthetic account is used only for this verification and removed afterwards.
- Browser verification checks desktop and phone viewport layouts, writing fallback, playback controls, and target changes. A viewport check is not a physical iOS/Android microphone test. Real microphones, Bluetooth routing, Safari interruptions, backgrounding, and varied accents still need human beta testing. No universal accuracy or pronunciation-scoring claim is made.
- Browser API behavior references: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia and https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext.
