-- Apply explicitly to an approved branch. This migration makes no provider calls.
CREATE TABLE IF NOT EXISTS provider_request_usage (
  account_id uuid NOT NULL REFERENCES learner_accounts(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('tutor', 'transcription')),
  usage_date date NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 0),
  PRIMARY KEY (account_id, feature, usage_date)
);
CREATE TABLE IF NOT EXISTS provider_project_usage (
  usage_date date PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

-- Tutor token reservations are aggregate counters only. Additive changes keep
-- existing speech request rows and their request-only reservation intact.
ALTER TABLE provider_request_usage
  ADD COLUMN IF NOT EXISTS token_count bigint NOT NULL DEFAULT 0 CHECK (token_count >= 0);
ALTER TABLE provider_project_usage
  ADD COLUMN IF NOT EXISTS tutor_request_count integer NOT NULL DEFAULT 0 CHECK (tutor_request_count >= 0),
  ADD COLUMN IF NOT EXISTS tutor_token_count bigint NOT NULL DEFAULT 0 CHECK (tutor_token_count >= 0);

-- One transaction reserves both counters. The project-day lock serializes
-- reservations across API instances and features; deletion of an account does
-- not refund project usage. Date boundaries use UTC on the database server.
CREATE OR REPLACE FUNCTION reserve_provider_request(
  learner uuid, requested_feature text, project_limit integer, account_limit integer
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  today date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  project_count integer;
  account_count bigint;
BEGIN
  IF project_limit IS NULL OR account_limit IS NULL OR
     project_limit <= 0 OR account_limit <= 0 OR
     learner IS NULL OR requested_feature IS NULL OR
     requested_feature NOT IN ('tutor', 'transcription') THEN
    RETURN 'unavailable';
  END IF;
  INSERT INTO provider_project_usage (usage_date) VALUES (today)
    ON CONFLICT DO NOTHING;
  SELECT request_count INTO project_count FROM provider_project_usage
    WHERE usage_date = today FOR UPDATE;
  IF project_count >= project_limit THEN RETURN 'project-limit'; END IF;
  SELECT COALESCE(SUM(request_count), 0) INTO account_count
    FROM provider_request_usage WHERE account_id = learner AND usage_date = today;
  IF account_count >= account_limit THEN RETURN 'account-limit'; END IF;
  INSERT INTO provider_request_usage (account_id, feature, usage_date, request_count)
    VALUES (learner, requested_feature, today, 1)
    ON CONFLICT (account_id, feature, usage_date) DO UPDATE
    SET request_count = provider_request_usage.request_count + 1;
  UPDATE provider_project_usage SET request_count = request_count + 1 WHERE usage_date = today;
  RETURN NULL;
END;
$$;

-- Project-day row locking serializes tutor and speech reservations across API
-- instances. All request and token checks happen before any counter changes.
CREATE OR REPLACE FUNCTION reserve_tutor_request(
  learner uuid,
  shared_project_limit integer,
  shared_account_limit integer,
  tutor_project_request_limit integer,
  tutor_account_request_limit integer,
  tutor_project_token_limit bigint,
  tutor_account_token_limit bigint,
  reserved_tokens bigint
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  today date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  project_record provider_project_usage%ROWTYPE;
  account_requests bigint;
  tutor_record provider_request_usage%ROWTYPE;
BEGIN
  IF learner IS NULL OR
     shared_project_limit IS NULL OR shared_project_limit <= 0 OR
     shared_account_limit IS NULL OR shared_account_limit <= 0 OR
     tutor_project_request_limit IS NULL OR tutor_project_request_limit <= 0 OR
     tutor_account_request_limit IS NULL OR tutor_account_request_limit <= 0 OR
     tutor_project_token_limit IS NULL OR tutor_project_token_limit <= 0 OR
     tutor_account_token_limit IS NULL OR tutor_account_token_limit <= 0 OR
     reserved_tokens IS NULL OR reserved_tokens <= 0 THEN
    RETURN 'unavailable';
  END IF;
  INSERT INTO provider_project_usage (usage_date) VALUES (today)
    ON CONFLICT DO NOTHING;
  SELECT * INTO project_record FROM provider_project_usage
    WHERE usage_date = today FOR UPDATE;
  IF project_record.request_count >= shared_project_limit OR
     project_record.tutor_request_count >= tutor_project_request_limit OR
     project_record.tutor_token_count > tutor_project_token_limit - reserved_tokens THEN
    RETURN 'project-limit';
  END IF;
  SELECT COALESCE(SUM(request_count), 0) INTO account_requests
    FROM provider_request_usage WHERE account_id = learner AND usage_date = today;
  IF account_requests >= shared_account_limit THEN RETURN 'account-limit'; END IF;
  SELECT * INTO tutor_record FROM provider_request_usage
    WHERE account_id = learner AND feature = 'tutor' AND usage_date = today;
  IF COALESCE(tutor_record.request_count, 0) >= tutor_account_request_limit OR
     COALESCE(tutor_record.token_count, 0) > tutor_account_token_limit - reserved_tokens THEN
    RETURN 'account-limit';
  END IF;
  INSERT INTO provider_request_usage (account_id, feature, usage_date, request_count, token_count)
    VALUES (learner, 'tutor', today, 1, reserved_tokens)
    ON CONFLICT (account_id, feature, usage_date) DO UPDATE
    SET request_count = provider_request_usage.request_count + 1,
        token_count = provider_request_usage.token_count + reserved_tokens;
  UPDATE provider_project_usage
    SET request_count = request_count + 1,
        tutor_request_count = tutor_request_count + 1,
        tutor_token_count = tutor_token_count + reserved_tokens
    WHERE usage_date = today;
  RETURN NULL;
END;
$$;
