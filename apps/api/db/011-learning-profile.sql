ALTER TABLE learner_accounts ADD COLUMN IF NOT EXISTS learning_profile jsonb NOT NULL
 DEFAULT '{"level":"new","reasons":["culture"]}'::jsonb CHECK (jsonb_typeof(learning_profile) = 'object');
