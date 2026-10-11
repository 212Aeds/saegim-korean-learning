-- Cached authored audio only; never store learner recordings/transcripts here.
CREATE TABLE IF NOT EXISTS korean_audio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key char(64) NOT NULL CHECK (content_key ~ '^[0-9a-f]{64}$'),
  voice_id text NOT NULL CHECK (voice_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  model_version text NOT NULL CHECK (length(model_version) BETWEEN 1 AND 100),
  storage_key text NOT NULL UNIQUE CHECK (length(storage_key) BETWEEN 1 AND 240),
  content_type text NOT NULL CHECK (content_type IN ('audio/mpeg', 'audio/wav', 'audio/ogg')),
  byte_length integer NOT NULL CHECK (byte_length BETWEEN 1 AND 5242880),
  source_content_id text NOT NULL CHECK (length(source_content_id) BETWEEN 1 AND 120),
  license text NOT NULL CHECK (length(trim(license)) BETWEEN 1 AND 500),
  checksum char(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  reviewed boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_key, voice_id, model_version),
  CHECK (NOT reviewed OR (length(trim(reviewed_by)) > 0 AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL))
);
