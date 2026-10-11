CREATE TABLE IF NOT EXISTS learner_progress (
  learner_id uuid PRIMARY KEY,
  completed_lessons integer NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
  reviews_done integer NOT NULL DEFAULT 0 CHECK (reviews_done >= 0),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_activity date,
  activity_dates date[] NOT NULL DEFAULT '{}',
  review_items jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(review_items) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
