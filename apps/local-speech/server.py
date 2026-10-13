"""Local Korean speech. No paid APIs; bind to loopback by default."""
import io
import os
import tempfile
import threading
import wave
import sys
import importlib.util
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from werkzeug.exceptions import HTTPException

for output in (sys.stdout, sys.stderr):
    if hasattr(output, "reconfigure"):
        output.reconfigure(encoding="utf-8")


class Models:
    def __init__(self):
        self.whisper = None
        self.tts = None

    def transcribe(self, audio):
        import numpy as np
        # Browser converts to PCM WAV; this avoids external/native media decoders.
        with wave.open(io.BytesIO(audio)) as wav:
            if wav.getnchannels() != 1 or wav.getsampwidth() != 2 or wav.getframerate() != 16000:
                raise ValueError("Audio must be mono 16 kHz PCM16 WAV.")
            samples = np.frombuffer(wav.readframes(16000 * 31), dtype="<i2").astype(np.float32) / 32768
        if not 8000 <= len(samples) <= 16000 * 30:
            raise ValueError("Record between half a second and 30 seconds.")
        if np.sqrt(np.mean(samples ** 2)) < 0.002:
            return ""
        if os.getenv("WHISPER_ENGINE", "openai") == "openai":
            import whisper
            if self.whisper is None:
                self.whisper = whisper.load_model(os.getenv("WHISPER_MODEL", "small"),
                    device=os.getenv("WHISPER_DEVICE", "cpu"))
            result = self.whisper.transcribe(samples, language="ko", task="transcribe",
                fp16=os.getenv("WHISPER_DEVICE", "cpu") != "cpu", condition_on_previous_text=False)
            return " ".join(s["text"].strip() for s in result["segments"] if s["no_speech_prob"] < 0.8).strip()
        from faster_whisper import WhisperModel
        if self.whisper is None:
            self.whisper = WhisperModel(os.getenv("WHISPER_MODEL", "small"),
                device=os.getenv("WHISPER_DEVICE", "cpu"),
                compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"))
        # Never supply the expected answer as a prompt: it can bias recognition.
        segments, _ = self.whisper.transcribe(samples, language="ko", task="transcribe",
            beam_size=5, condition_on_previous_text=False, vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 600})
        return " ".join(s.text.strip() for s in segments if s.no_speech_prob < 0.8).strip()

    def synthesize(self, text):
        if sys.platform == "win32" and importlib.util.find_spec("eunjeon") is None:
            raise RuntimeError("Install requirements-voice.txt before starting speech.")
        # Melo imports its Japanese tokenizer even for Korean; use the bundled
        # lightweight dictionary instead of downloading the full Japanese one.
        import unidic
        import unidic_lite
        unidic.DICDIR = unidic_lite.DICDIR
        from melo.api import TTS
        if self.tts is None:
            self.tts = TTS(language="KR", device=os.getenv("TTS_DEVICE", "cpu"))
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "speech.wav"
            self.tts.tts_to_file(text, self.tts.hps.data.spk2id["KR"], str(path), speed=1.0, quiet=True)
            return path.read_bytes()


def create_app(models=None, origins=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.config["TRUSTED_HOSTS"] = ["127.0.0.1", "localhost"]
    models = models or Models()
    allowed = set(origins if origins is not None else os.getenv("SPEECH_ALLOWED_ORIGINS",
        "http://127.0.0.1:3018,http://127.0.0.1:3019,http://localhost:3016").split(","))
    lock = threading.Lock()

    @app.before_request
    def check_origin():
        origin = request.headers.get("Origin")
        if origin and origin not in allowed:
            return jsonify(error="This website is not allowed to use the speech server."), 403
        if request.method == "OPTIONS":
            return "", 204

    @app.after_request
    def cors(response):
        origin = request.headers.get("Origin")
        if origin in allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.errorhandler(Exception)
    def error(exception):
        if isinstance(exception, HTTPException):
            return jsonify(error=exception.description), exception.code
        if isinstance(exception, (ValueError, wave.Error, EOFError)):
            return jsonify(error=str(exception)), 400
        app.logger.exception("Local speech failed")
        return jsonify(error="Local model unavailable. Check the speech server console; no paid fallback was used."), 503

    @app.get("/health")
    def health():
        return jsonify(status="ok", transcription=os.getenv("WHISPER_ENGINE", "openai") + "-whisper", speech="MeloTTS-Korean",
                       paidFallback=False)

    def run_model(fn):
        if not lock.acquire(blocking=False):
            return jsonify(error="Speech server is busy. Try again shortly."), 429
        try:
            return fn()
        finally:
            lock.release()

    @app.post("/v1/speech/transcribe")
    def transcribe():
        audio = request.files.get("audio")
        if audio is None:
            return jsonify(error="Upload an audio file in the audio field."), 400
        data = audio.read()
        if not data:
            return jsonify(error="No audio was captured."), 400
        return run_model(lambda: jsonify(transcript=models.transcribe(data), language="ko"))

    @app.post("/v1/speech/synthesize")
    def synthesize():
        body = request.get_json(silent=True)
        text = body.get("text") if isinstance(body, dict) else None
        if not isinstance(text, str) or not text.strip() or len(text) > 500:
            return jsonify(error="Provide 1–500 characters of text."), 400
        return run_model(lambda: send_file(io.BytesIO(models.synthesize(text.strip())), mimetype="audio/wav"))

    return app


if __name__ == "__main__":
    import torch
    from waitress import serve
    torch.set_num_threads(4)
    models = Models()
    print("Preparing local Korean voice. First startup downloads model files…", flush=True)
    models.synthesize("안녕하세요.")
    if os.getenv("WHISPER_ENGINE", "openai") == "openai":
        import whisper
        models.whisper = whisper.load_model(os.getenv("WHISPER_MODEL", "small"), device=os.getenv("WHISPER_DEVICE", "cpu"))
    print("Local Korean speech ready at http://127.0.0.1:5055", flush=True)
    serve(create_app(models), host="127.0.0.1", port=5055, threads=4)
