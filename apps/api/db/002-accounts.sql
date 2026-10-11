CREATE TABLE IF NOT EXISTS learner_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (length(email) <= 120),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_sessions (
  token_hash char(64) PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES learner_accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learner_sessions_expiry_idx
  ON learner_sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash char(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_expiry_idx
  ON auth_rate_limits(expires_at);

ALTER TABLE learner_progress
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES learner_accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS completed_lesson_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS words_learned text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quiz_attempts integer NOT NULL DEFAULT 0 CHECK (quiz_attempts >= 0),
  ADD COLUMN IF NOT EXISTS quiz_correct integer NOT NULL DEFAULT 0 CHECK (quiz_correct >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS learner_progress_account_id_idx
  ON learner_progress(account_id);
