ALTER TABLE learner_progress
  ADD COLUMN IF NOT EXISTS daily_goal_minutes integer NOT NULL DEFAULT 15
  CHECK (daily_goal_minutes IN (5, 10, 15, 20, 30, 45, 60));
ALTER TABLE learner_progress
  ADD COLUMN IF NOT EXISTS speaking_card_ids text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS korean_words (
  word text PRIMARY KEY,
  romanization text NOT NULL,
  meaning text NOT NULL,
  category text NOT NULL,
  part_of_speech text NOT NULL,
  example text,
  example_translation text,
  source text NOT NULL DEFAULT 'cc-kedict',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS korean_words_category_word_idx
  ON korean_words(category, word);
CREATE INDEX IF NOT EXISTS korean_words_romanization_idx
  ON korean_words(romanization);
