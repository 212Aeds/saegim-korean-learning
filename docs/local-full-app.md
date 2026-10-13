# Full app with local AI and speech

The full account app is restored on http://localhost:3016, using the existing
database and saved account progress. The separate static device-only package
remains available; its browser progress is not imported automatically.

Local mode uses Qwen3 14B in Ollama for the existing question tutor and skill-based
text/voice conversations. Whisper transcribes speech; Supertonic 3 reads Korean.
Chris and Jessica remain simulated chat profiles. Chris uses the M1 male preset and Jessica uses the F1 female preset;
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

Voice generation uses pinned local Supertonic 3 weights with distinct male/female presets, bounded RAM caching, and saved listening pace up to 1.40×. Standard dev commands now default to local providers and explicitly disable paid APIs. Model licensing conditions still apply; see the voice setup guide.

## OpenAI model evaluation

Local `gpt-oss:20b` has no OpenAI API charges. It was installed and evaluated,
but CUDA initialization failed on this laptop. CPU mode ran successfully;
however, the Hangul check produced an incorrect vowel-placement statement and
an invalid syllable-building exercise. Qwen3 14B remains the default tutor.
The local adapter supports GPT-OSS low reasoning effort and CPU-only execution
for future evaluation via `LOCAL_TUTOR_MODEL` and `LOCAL_TUTOR_CPU_ONLY=true`.
Hosted OpenAI API models and ElevenLabs are not enabled in this configuration.
## Learning and playback polish

Saving a different proficiency level flushes current progress, shows the startup screen, and reloads the account and recommendations. Completed lessons and review ratings are preserved.

Listening pace and voice controls are available for local speech in lessons, review, and speaking. Conversation has its own session pace (starts at 1.00x with a gentler model baseline), optional spoken chat replies, Stop audio, and cancellation of pending text replies. A new scenario starts a fresh conversation without locking the scenario buttons after the first exchange.

Both TTS presets are warmed before Flask starts accepting requests. Current card/example audio is prepared ahead and generated audio is cached in bounded browser memory (24 clips, 8 MB) as well as the speech server. Requests for the same phrase and voice share preparation; canceled playback cannot start stale audio. Generated audio can still take time for a new sentence. No microphone recordings are cached.

Verification: 57 app tests, six Flask tests, production web build, browser checks for card face visibility, local speech controls, Qwen chat submission, Chris playback, and level-specific refresh.

## Voice and tutor presentation

Supertonic generation uses speed 0.9 while the displayed baseline stays 1.00x. Both M1 and F1 receive sentence-ending punctuation, a 120 ms lead-in, a 300 ms tail, and the same chunk pause. Generated samples are preserved in full. Both voices transcribed the complete test sentence, including its ending, in a local Whisper round trip; this is a sample check, not a guarantee for every sentence. New sample preparation took about 2.3 seconds, with cached replay preparation about 0.01 seconds.

Tutor questions and answers form a thread above the bottom composer; two recent exchanges provide follow-up context. Conversation starter buttons send their prompt immediately. Responses are asked to be concise with accurate speech-level labels. Korean inputs, keyboard links, focus states, and selected partner buttons follow the app styling. Lessons use one Listen entry per exercise. Technical provider notices are removed from practice screens; privacy information remains on the Privacy page.
## Course growth and longer progress

The course now contains 102 lessons and 762 authored questions. Six new topics (clothes, home, staying, calendars, messages, and meetups) add 18 connected lessons and 36 vocabulary entries. Each chapter follows words, exchanges, and consolidation. The vocabulary reference index includes exact entries in the pinned cc-kedict corpus; meanings and examples are app adaptations under the existing attribution. New lessons with past tense or requests wait for those grammar lessons.

Living Korean and Korean connections bring the course to six pathways. Learn shows a 14-chapter collection with actual completion for each of three stages, prerequisites, and revisit actions. Pathway lesson lists can be collapsed. Speaking includes 36 additional sentence-example records; the fully unlocked deck has 93 distinct speaking concepts after deduplication. Actual lesson completion can unlock speaking examples without manually raising the self-reported level. The tutor now offers eight practice situations with short situation-specific examples.

A complete authored-question collection has 621 deduplicated review cards, exceeding the former 500-card schema limit. The bounded limit is now 2,000 cards. JSON parsing accepts up to 2 MB; a 174,568-byte unauthenticated progress request passed parsing and returned 401, preserving account protection. Activity history retains up to 3,660 dates, with 180-, 365-, and 730-day milestones. Tests confirm a real 366-day sequence reaches the year milestone and duplicate IDs never award chapter completion.

Background voice preparation keeps the latest pending card when navigation is rapid. Stopped or obsolete audio cannot reset a newer playback/recording state. Word examples respect saved pace and wait for complete audio, with an explicit Stop control. Models and paid-provider guards are unchanged.

Verification: 63 app tests; production web and API builds; desktop 1280px and phone 390px layout checks showed no horizontal overflow for Learn, Words, and Tutor. Mobile vocabulary cards adapt to one column. Chapter and pathway opening animations honor reduced-motion preferences. New word-example playback, Stop/restart, and tutor hotel practice were checked in the browser.
