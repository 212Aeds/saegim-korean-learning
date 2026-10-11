ALTER TABLE korean_words
  ADD COLUMN IF NOT EXISTS stable_id text,
  ADD COLUMN IF NOT EXISTS source_license text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'unreviewed';

UPDATE korean_words
SET source_license = 'CC BY-SA 3.0'
WHERE source = 'cc-kedict' AND source_license = 'unknown';

CREATE UNIQUE INDEX IF NOT EXISTS korean_words_stable_id_idx
  ON korean_words(stable_id)
  WHERE stable_id IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE korean_words
    ADD CONSTRAINT korean_words_review_status_check
    CHECK (review_status IN ('unreviewed', 'editor_review_required', 'editor_reviewed', 'curated'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
