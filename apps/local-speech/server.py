"""Local Korean speech. No paid APIs; bind to loopback by default."""
import io
import os
import threading
import wave
import sys
from collections import OrderedDict
from hashlib import sha256
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from werkzeug.exceptions import HTTPException

for output in (sys.stdout, sys.stderr):
    if hasattr(output, "reconfigure"):
        output.reconfigure(encoding="utf-8")


def finish_recording(samples, sample_rate):
    """Balance exported clips without deleting any generated samples."""
    import numpy as np
    result=np.asarray(samples,dtype=np.float32).flatten().copy()
    if not len(result) or not np.all(np.isfinite(result)):
        raise ValueError("Invalid generated audio.")
    peak=float(np.max(np.abs(result)))
    if peak>0.0001:
        active=result[np.abs(result)>peak*0.02]
        rms=float(np.sqrt(np.mean(active**2)))
        gain=min(2.0,0.12/max(rms,0.0001),0.8912/peak)
        result*=gain
    fade=min(int(sample_rate*0.005),len(result)//2)
    if fade:
        ramp=np.linspace(0,1,fade,dtype=np.float32)
        result[:fade]*=ramp
        result[-fade:]*=ramp[::-1]
    return result


class Models:
    def __init__(self):
        self.whisper = None
        self.tts = None
        self.audio_cache = OrderedDict()
        self.whisper_device = None

    def prepare_whisper(self):
        import torch
        import whisper
        requested = os.getenv("WHISPER_DEVICE", "auto")
        device = ("cuda" if torch.cuda.is_available() else "cpu") if requested == "auto" else requested
        try:
            self.whisper = whisper.load_model(os.getenv("WHISPER_MODEL", "medium"), device=device)
            if device == "cuda":
                self.whisper.half()
                # Whisper normalizes in float32 even when attention uses fp16.
                for module in self.whisper.modules():
                    if isinstance(module, torch.nn.LayerNorm):
                        module.float()
        except RuntimeError:
            if device != "cuda" or requested != "auto":
                raise
            self.whisper = whisper.load_model(os.getenv("WHISPER_MODEL", "medium"), device="cpu")
            device = "cpu"
        self.whisper_device = device

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
                self.prepare_whisper()
            result = self.whisper.transcribe(samples, language="ko", task="transcribe",
                fp16=self.whisper_device == "cuda", condition_on_previous_text=False,
                initial_prompt="한국어 대화와 한글 연습입니다. 기역, 니은, 디귿, 리을, 미음, 비읍, 시옷, 이응, 지읒, 치읓, 키읔, 티읕, 피읖, 히읗.")
            return " ".join(s["text"].strip() for s in result["segments"] if s["no_speech_prob"] < 0.8).strip()
        from faster_whisper import WhisperModel
        if self.whisper is None:
            self.whisper = WhisperModel(os.getenv("WHISPER_MODEL", "medium"),
                device=os.getenv("WHISPER_DEVICE", "cpu"),
                compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"))
        # Never supply the expected answer as a prompt: it can bias recognition.
        segments, _ = self.whisper.transcribe(samples, language="ko", task="transcribe",
            beam_size=5, condition_on_previous_text=False, vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 600})
        return " ".join(s.text.strip() for s in segments if s.no_speech_prob < 0.8).strip()

    def synthesize(self, text, voice="jessica", quality="standard"):
        import numpy as np
        import soundfile
        from supertonic import TTS
        preset = "M1" if voice == "chris" else "F1"
        cache_key = sha256((preset + "|" + quality + "|" + text).encode()).digest()
        if cache_key in self.audio_cache:
            self.audio_cache.move_to_end(cache_key)
            return self.audio_cache[cache_key]
        if self.tts is None:
            model_dir = os.getenv("LOCAL_TTS_MODEL_DIR") or str(Path(__file__).resolve().parents[3] / "work/supertonic-3")
            self.tts = TTS(model="supertonic-3", model_dir=model_dir, auto_download=False,
                           intra_op_num_threads=4, inter_op_num_threads=1)
        style = self.tts.get_voice_style(voice_name=preset)
        sentence = text if text.endswith((".", "!", "?", "。", "！", "？")) else text + "."
        wav, _ = self.tts.synthesize(sentence, lang="ko", voice_style=style, total_steps=16 if quality == "recording" else 8,
                                   speed=0.9, silence_duration=0.25)
        # Preserve all generated samples and leave breathing room at both edges.
        # Both presets use the same envelope; never crop Jessica's final syllable.
        body = finish_recording(wav, self.tts.sample_rate) if quality == "recording" else wav.flatten()
        samples = np.pad(body, (int(self.tts.sample_rate * 0.12), int(self.tts.sample_rate * 0.3)))
        output = io.BytesIO()
        soundfile.write(output, samples, self.tts.sample_rate, format="WAV", subtype="PCM_16")
        audio = output.getvalue()
        self.audio_cache[cache_key] = audio
        # Bounded, volatile cache of generated audio. Never cache recordings.
        while len(self.audio_cache) > 32 or sum(len(value) for value in self.audio_cache.values()) > 8 * 1024 * 1024:
            self.audio_cache.popitem(last=False)
        return audio


def create_app(models=None, origins=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.config["TRUSTED_HOSTS"] = ["127.0.0.1", "localhost"]
    models = models or Models()
    allowed = set(origins if origins is not None else os.getenv("SPEECH_ALLOWED_ORIGINS",
        "http://127.0.0.1:3018,http://127.0.0.1:3019,http://localhost:3016").split(","))
    locks = {"transcribe": threading.Lock(), "synthesize": threading.Lock()}

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
        return jsonify(status="ok", transcription=os.getenv("WHISPER_ENGINE", "openai") + "-whisper", speech="Supertonic-3",
                       voices={"chris":"M1", "jessica":"F1"}, device=getattr(models,"whisper_device",None), paidFallback=False)

    def run_model(fn, kind):
        lock = locks[kind]
        if not lock.acquire(timeout=10):
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
        return run_model(lambda: jsonify(transcript=models.transcribe(data), language="ko"), "transcribe")

    @app.post("/v1/speech/synthesize")
    def synthesize():
        body = request.get_json(silent=True)
        text = body.get("text") if isinstance(body, dict) else None
        if not isinstance(text, str) or not text.strip() or len(text) > 500:
            return jsonify(error="Provide 1–500 characters of text."), 400
        voice = body.get("voice", "jessica")
        if voice not in ("chris", "jessica"):
            return jsonify(error="Choose chris or jessica."), 400
        quality = body.get("quality", "standard")
        if quality not in ("standard", "recording"):
            return jsonify(error="Choose standard or recording quality."), 400
        return run_model(lambda: send_file(io.BytesIO(models.synthesize(text.strip(), voice, quality) if quality == "recording" else models.synthesize(text.strip(), voice)), mimetype="audio/wav"), "synthesize")

    return app


if __name__ == "__main__":
    import torch
    from waitress import serve
    torch.set_num_threads(4)
    models = Models()
    print("Preparing both local Korean voices from installed model files…", flush=True)
    for voice in ("jessica", "chris"):
        models.synthesize("안녕하세요.", voice)
    if os.getenv("WHISPER_ENGINE", "openai") == "openai":
        models.prepare_whisper()
        print("Whisper ready on " + models.whisper_device, flush=True)
    print("Local Korean speech ready at http://127.0.0.1:5055", flush=True)
    serve(create_app(models), host="127.0.0.1", port=5055, threads=4)
