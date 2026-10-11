ALTER TABLE learner_progress
  ADD COLUMN IF NOT EXISTS speaking_card_id text,
  ADD COLUMN IF NOT EXISTS learning_preferences jsonb NOT NULL DEFAULT '{"romanization":true,"hangulSize":"standard","hintLevel":"standard"}'::jsonb
    CHECK (jsonb_typeof(learning_preferences) = 'object');
