-- Persist generated lesson speech so repeated listening does not call the
-- paid provider again. Learner recordings and transcripts are never stored.
CREATE TABLE IF NOT EXISTS korean_speech_cache (
  content_key char(64) NOT NULL CHECK (content_key ~ '^[0-9a-f]{64}$'),
  voice_id text NOT NULL CHECK (voice_id IN ('jessica', 'chris')),
  model_version text NOT NULL CHECK (length(model_version) BETWEEN 1 AND 100),
  content_type text NOT NULL CHECK (content_type = 'audio/mpeg'),
  audio_bytes bytea NOT NULL CHECK (octet_length(audio_bytes) BETWEEN 1 AND 5242880),
  checksum char(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_key, voice_id, model_version)
);
