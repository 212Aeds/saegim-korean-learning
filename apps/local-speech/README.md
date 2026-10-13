# Local Korean speech

Flask + Waitress on `http://127.0.0.1:5055`. Original Whisper recognizes Korean by default; faster-whisper is optional (`WHISPER_ENGINE=faster`);
MeloTTS speaks Korean with its own KR voice, not ElevenLabs Chris/Jessica.
No API keys, billed inference, or paid fallback. Initial model downloads need
internet and disk space; later inference runs on this machine. Electricity and
hardware are still your responsibility.

## Windows setup (repository root)

Use Python 3.10 for MeloTTS compatibility, in an isolated environment:

```powershell
python -m pip install uv
python -m uv venv --python 3.10 apps/local-speech/.venv
python -m uv pip install --python apps/local-speech/.venv/Scripts/python.exe -r apps/local-speech/requirements-voice.txt
apps/local-speech/.venv/Scripts/python.exe apps/local-speech/server.py
```

Wait for `Local Korean speech ready` before opening practice. Startup warms
the voice and transcription models before accepting requests; first startup
also downloads weights and tokenizer resources. Later starts reuse cached files.
In another terminal:

```powershell
npm run build:local-speech
python -m http.server 3019 --bind 127.0.0.1 --directory apps/web/.next-local-speech
```

Open http://127.0.0.1:3019/. This origin has separate browser progress from 3018.

CPU transcription is the default, with multilingual Whisper `small`.
For a compatible CUDA/CTranslate2 installation, set `WHISPER_DEVICE=cuda`
and `WHISPER_COMPUTE_TYPE=float16`. `WHISPER_MODEL=medium` increases model
size and compute requirements. GPU configuration is optional, not automatic.
Melo's upstream recommends Docker on Windows if native dependencies fail.

## App integration

Set `NEXT_PUBLIC_LOCAL_SPEECH_URL=http://127.0.0.1:5055` for a local web build
and leave paid features disabled. Rebuild/restart the web app after changing
this build-time variable. Speech practice detects server health before allowing
recording; listening prioritizes the configured server. Failures never switch
to a paid service. Typed practice remains usable.

`npm run build:free` deliberately clears the local endpoint. A static public
website cannot host Python, and visitors' `127.0.0.1` points to their own computers.
Serving everyone from your laptop would require a secured HTTPS deployment,
authentication, quotas, and an always-on connection. This loopback service is
for local use; do not expose it directly to the internet.

Allowed origins default to localhost:3016 and 127.0.0.1 ports 3018 and 3019.
`SPEECH_ALLOWED_ORIGINS` accepts a comma-separated explicit list.
Recordings go to the configured server and are decoded in memory; no audio or
transcript is retained by the service. Temporary synthesis files are removed.
Recordings stop after 1.8 seconds of quiet after speech (maximum 12 seconds).
The server accepts at most 8 MB / 30 seconds; one inference request runs at a time.
Whisper transcription comparison is not a phoneme-level pronunciation grade.

## Endpoints and verification

- `GET /health`: server status, model names, `paidFallback: false` (not a model warmup check).
- `POST /v1/speech/transcribe`: multipart `audio` (mono 16 kHz PCM16 WAV); `{transcript, language: "ko"}`.
- `POST /v1/speech/synthesize`: JSON `{text}` (1–500 chars); WAV response.
- Errors: JSON `{error}` with 400, 403, 413, 429 or 503.

```powershell
apps/local-speech/.venv/Scripts/python.exe -m unittest discover -s apps/local-speech -p test_server.py
```

Sources: [Whisper](https://github.com/openai/whisper), [faster-whisper](https://github.com/SYSTRAN/faster-whisper),
[MeloTTS Korean model](https://huggingface.co/myshell-ai/MeloTTS-Korean),
[MeloTTS license and installation](https://github.com/myshell-ai/MeloTTS).

Local commands: `npm run speech:local` and `npm run build:local-speech`. Serve apps/web/.next-local-speech on port 3019. The public publishing build remains separate.

On this Windows machine PyAV was blocked by Application Control. The default original Whisper engine uses browser-converted PCM WAV without PyAV; no security policy is changed.

Verified locally: Korean MeloTTS synthesis of “안녕하세요. 이거 얼마예요?”
was transcribed to the same text by Whisper small; silent WAV returned an empty
transcript. This generated-audio check does not prove recognition accuracy for
all learners or microphones. CPU inference can take longer than realtime.
