import io
import unittest
from server import create_app

class FakeModels:
    def transcribe(self, audio):
        return "이거 얼마예요?"
    def synthesize(self, text, voice="jessica"):
        return b"RIFFtest"

class ServerTests(unittest.TestCase):
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
