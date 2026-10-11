-- Apply to the production database before enabling paid OpenRouter audio.
-- Budget amounts use micro-USD (one USD = 1,000,000 units) and are reserved
-- before an external request. The controller estimates against non-promotional
-- catalog prices, so temporary discounts never raise the learner-facing cap.
ALTER TABLE provider_request_usage
  DROP CONSTRAINT IF EXISTS provider_request_usage_feature_check;
ALTER TABLE provider_request_usage
  ADD CONSTRAINT provider_request_usage_feature_check
  CHECK (feature IN ('tutor', 'transcription', 'tts'));

CREATE TABLE IF NOT EXISTS provider_monthly_spend (
  usage_month date PRIMARY KEY,
  reserved_micro_usd bigint NOT NULL DEFAULT 0 CHECK (reserved_micro_usd >= 0)
);

CREATE OR REPLACE FUNCTION reserve_provider_audio_request(
  p_learner uuid,
  p_requested_feature text,
  p_project_daily_limit integer,
  p_account_daily_limit integer,
  p_reserved_micro_usd bigint,
  p_monthly_cap_micro_usd bigint
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  today date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  month_start date := date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  project_count integer;
  account_count bigint;
  monthly_count bigint;
BEGIN
  IF p_learner IS NULL OR p_requested_feature NOT IN ('transcription', 'tts') OR
     p_project_daily_limit IS NULL OR p_project_daily_limit <= 0 OR
     p_account_daily_limit IS NULL OR p_account_daily_limit <= 0 OR
     p_reserved_micro_usd IS NULL OR p_reserved_micro_usd <= 0 OR
     p_monthly_cap_micro_usd IS NULL OR p_monthly_cap_micro_usd <= 0 THEN
    RETURN 'unavailable';
  END IF;

  INSERT INTO provider_project_usage (usage_date) VALUES (today) ON CONFLICT DO NOTHING;
  SELECT request_count INTO project_count FROM provider_project_usage
    WHERE usage_date = today FOR UPDATE;
  IF project_count >= p_project_daily_limit THEN RETURN 'project-limit'; END IF;
  SELECT COALESCE(SUM(request_count), 0) INTO account_count
    FROM provider_request_usage WHERE account_id = p_learner AND usage_date = today;
  IF account_count >= p_account_daily_limit THEN RETURN 'account-limit'; END IF;

  INSERT INTO provider_monthly_spend (usage_month) VALUES (month_start) ON CONFLICT DO NOTHING;
  SELECT reserved_micro_usd INTO monthly_count FROM provider_monthly_spend
    WHERE usage_month = month_start FOR UPDATE;
  IF monthly_count > p_monthly_cap_micro_usd - p_reserved_micro_usd THEN RETURN 'spend-limit'; END IF;

  INSERT INTO provider_request_usage (account_id, feature, usage_date, request_count)
    VALUES (p_learner, p_requested_feature, today, 1)
    ON CONFLICT (account_id, feature, usage_date) DO UPDATE
    SET request_count = provider_request_usage.request_count + 1;
  UPDATE provider_project_usage SET request_count = request_count + 1 WHERE usage_date = today;
  UPDATE provider_monthly_spend
    SET reserved_micro_usd = provider_monthly_spend.reserved_micro_usd + p_reserved_micro_usd
    WHERE usage_month = month_start;
  RETURN NULL;
END;
$$;
