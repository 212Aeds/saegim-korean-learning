# Full app with local AI and speech

The full account app is restored on http://localhost:3016, using the existing
database and saved account progress. The separate static device-only package
remains available; its browser progress is not imported automatically.

Local mode uses Qwen3 14B in Ollama for the existing question tutor and skill-based
text/voice conversations. Whisper transcribes speech; MeloTTS reads Korean.
Chris and Jessica remain simulated chat profiles. Both use the local KR voice;
these are not ElevenLabs-generated voices.

No paid API is enabled. Local tutor requests skip provider spend reservations,
while cloud tutor and cloud speech remain blocked by the paid-feature guard.
Accounts still require the configured Neon database; its hosting limits apply.
Local inference uses your computer's memory, electricity, and uptime.

## Restart from the repository root

Use separate terminals:

```powershell
npm run tutor:local
npm run speech:local
npm run dev:local:api
npm run dev:local:web
```

Alternatively, `npm run dev:local` starts all four services together. Stop the
already-running servers before using that command to avoid duplicate ports.

Wait for speech's ready message. Ollama must have `qwen3:14b` downloaded.
This workspace has a portable Ollama installation in `../work/ollama` and the
model in your user Ollama model cache. On another machine, install Ollama and
run `ollama pull qwen3:14b`, or set `LOCAL_OLLAMA_BIN` to your executable.
The local start command disables Ollama cloud and binds it to loopback.

The app has the original tutor forms, conversation history, profile-based
language difficulty, thinking pauses, and microphone pauses during playback.
Transcription goes to Flask in both one-shot and conversation practice. There
is no automatic cloud fallback. Text remains available when speech fails.
AI answers can still contain language errors; local does not guarantee accuracy.

This setup runs on your laptop. Public users cannot connect to your loopback
servers; a public full release needs secure reachable backend hosting.

Sources: [Qwen3 14B](https://ollama.com/library/qwen3:14b),
[Ollama structured replies](https://docs.ollama.com/capabilities/structured-outputs),
[local speech setup](../apps/local-speech/README.md).

The local tutor uses checked Hangul composition facts alongside the original teaching and conversation policies. Model answers still need editorial review. The tutor starter warms the GPU before announcing readiness.

Speech checks with medium correctly transcribed 너, 이거 얼마예요?, and 안녕하세요.
The isolated letter name 기역 was misrecognized in a generated-audio check.
Letter-name and very short sound exercises can still need retries or typed answers.
These checks do not establish accuracy for every learner or microphone.
