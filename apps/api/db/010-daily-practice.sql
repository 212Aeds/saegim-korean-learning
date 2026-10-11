ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS daily_practice jsonb NOT NULL
  DEFAULT '{"date":"","lessons":[],"reviews":[],"speaking":[]}'::jsonb
  CHECK (jsonb_typeof(daily_practice) = 'object');
