import io
import unittest
from unittest.mock import patch
import types
from server import create_app, Models

class FakeModels:
    def transcribe(self, audio):
        return "이거 얼마예요?"
    def synthesize(self, text, voice="jessica"):
        return b"RIFFtest"

class ServerTests(unittest.TestCase):
    def test_gpu_half_preserves_float_normalization_and_cpu_fallback(self):
        from unittest.mock import Mock
        class Norm:
            def __init__(self): self.restored = False
            def float(self): self.restored = True
        norm = Norm()
        model = Mock()
        model.modules.return_value = [norm]
        load = Mock(return_value=model)
        fake_torch = types.SimpleNamespace(cuda=types.SimpleNamespace(is_available=lambda: True), nn=types.SimpleNamespace(LayerNorm=Norm))
        with patch.dict('sys.modules', {'torch': fake_torch, 'whisper': types.SimpleNamespace(load_model=load)}), patch.dict('os.environ', {'WHISPER_DEVICE': 'auto'}):
            models = Models()
            models.prepare_whisper()
            self.assertEqual(models.whisper_device, 'cuda')
            model.half.assert_called_once()
            self.assertTrue(norm.restored)
            load.side_effect = [RuntimeError('GPU unavailable'), model]
            models.prepare_whisper()
            self.assertEqual(models.whisper_device, 'cpu')
            self.assertEqual(load.call_args.kwargs['device'], 'cpu')

    def test_both_voices_keep_all_audio_and_use_gentle_baseline(self):
        import numpy as np
        import soundfile
        class VoiceEngine:
            sample_rate = 24000
            calls = []
            def get_voice_style(self, voice_name):
                return voice_name
            def synthesize(self, text, **options):
                self.calls.append((text, options))
                return np.full((1, 2400), 0.25, dtype=np.float32), None
        engine = VoiceEngine()
        models = Models()
        models.tts = engine
        with patch.dict('sys.modules', {'supertonic': types.SimpleNamespace(TTS=object)}):
            for voice in ('jessica', 'chris'):
                audio = models.synthesize('안녕하세요', voice)
                samples, rate = soundfile.read(io.BytesIO(audio))
                self.assertEqual(rate, 24000)
                self.assertEqual(len(samples), 2400 + 2880 + 7200)
                self.assertTrue(np.all(samples[:2880] == 0))
                self.assertTrue(np.all(samples[2880:5280] == 0.25))
                self.assertTrue(np.all(samples[5280:] == 0))
        self.assertEqual([call[1]['voice_style'] for call in engine.calls], ['F1', 'M1'])
        for text, options in engine.calls:
            self.assertEqual(text, '안녕하세요.')
            self.assertEqual(options['speed'], 0.9)
    def setUp(self):
        self.client = create_app(FakeModels(), ["http://localhost:3016"]).test_client()
    def test_transcription(self):
        response = self.client.post('/v1/speech/transcribe', data={'audio': (io.BytesIO(b'audio'), 'clip.webm')})
        self.assertEqual(response.json['transcript'], '이거 얼마예요?')
    def test_missing_and_large_audio(self):
        self.assertEqual(self.client.post('/v1/speech/transcribe').status_code, 400)
        self.assertEqual(self.client.post('/v1/speech/transcribe', data=b'x' * (8 * 1024 * 1024 + 1)).status_code, 413)
    def test_tts_validation_and_audio(self):
        for body in ({}, {'text': 42}, {'text': 'x' * 501}):
            self.assertEqual(self.client.post('/v1/speech/synthesize', json=body).status_code, 400)
        response = self.client.post('/v1/speech/synthesize', json={'text':'안녕하세요'})
        self.assertEqual(response.content_type, 'audio/wav')
    def test_origin_boundary(self):
        self.assertEqual(self.client.post('/v1/speech/synthesize', json={'text':'안녕'}, headers={'Origin':'https://untrusted.example'}).status_code, 403)
        response = self.client.options('/v1/speech/synthesize', headers={'Origin':'http://localhost:3016'})
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:3016')
    def test_health_no_paid_fallback(self):
        self.assertFalse(self.client.get('/health').json['paidFallback'])
    def test_selected_voice_is_forwarded_and_unknown_voice_rejected(self):
        class Voices(FakeModels):
            calls = []
            def synthesize(self, text, voice="jessica"):
                self.calls.append(voice)
                return super().synthesize(text, voice)
        models=Voices(); client=create_app(models,[]).test_client()
        for voice in ('chris','jessica'):
            self.assertEqual(client.post('/v1/speech/synthesize',json={'text':'안녕하세요','voice':voice}).status_code,200)
        self.assertEqual(models.calls,['chris','jessica'])
        self.assertEqual(client.post('/v1/speech/synthesize',json={'text':'안녕하세요','voice':'unknown'}).status_code,400)

if __name__ == '__main__':
    unittest.main()
