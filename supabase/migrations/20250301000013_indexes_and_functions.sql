-- 013_indexes_and_functions.sql

-- ═══════ INDEXES ═══════

-- Attempt lookups by user + status (dashboard, concurrent attempt check)
CREATE INDEX idx_attempts_user_status
  ON attempts(user_id, status);

-- Expiry sweeper fallback (pg_cron)
CREATE INDEX idx_attempts_expiry_sweep
  ON attempts(expires_at)
  WHERE status IN ('started', 'in_progress');

-- Content selection: no-repeat window (last 50 attempts per user+domain+year)
CREATE INDEX idx_attempts_content_selection
  ON attempts(user_id, domain, year_level, created_at DESC);

-- Guest device cap enforcement (Phase 3)
CREATE INDEX idx_attempts_guest_device
  ON attempts(guest_device_id)
  WHERE guest_device_id IS NOT NULL;

-- Scoring job pickup (oldest pending first)
CREATE INDEX idx_scoring_jobs_pickup
  ON scoring_jobs(created_at ASC)
  WHERE status = 'pending';

-- DLQ monitoring
CREATE INDEX idx_dlq_unresolved
  ON dead_letter_queue(created_at)
  WHERE resolved = false;

-- Snapshot lookup by attempt
CREATE INDEX idx_snapshots_attempt
  ON attempt_snapshots(attempt_id);

-- Responses lookup by attempt
CREATE INDEX idx_responses_attempt
  ON attempt_responses(attempt_id);


-- ═══════ HELPER FUNCTIONS ═══════

-- F-05: Count active (non-terminal) attempts for a user, with row lock
-- Uses subquery to lock rows first (FOR UPDATE not allowed with aggregates)
CREATE FUNCTION count_active_attempts(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  active_count int;
BEGIN
  -- Lock the matching rows to serialize concurrent start requests
  PERFORM id
  FROM attempts
  WHERE user_id = p_user_id
    AND status IN ('created', 'started', 'in_progress')
  FOR UPDATE;

  -- Now count them
  SELECT count(*)::int INTO active_count
  FROM attempts
  WHERE user_id = p_user_id
    AND status IN ('created', 'started', 'in_progress');

  RETURN active_count;
END;
$$;

-- F-02: Atomic conditional upsert for responses
CREATE FUNCTION upsert_response(
  p_attempt_id uuid,
  p_item_snapshot_id uuid,
  p_response_payload jsonb,
  p_client_revision int
)
RETURNS TABLE(rows_affected int)
LANGUAGE sql
AS $$
  WITH upserted AS (
    INSERT INTO attempt_responses
      (attempt_id, item_snapshot_id, response_payload, client_revision, saved_at)
    VALUES (p_attempt_id, p_item_snapshot_id, p_response_payload, p_client_revision, now())
    ON CONFLICT (attempt_id, item_snapshot_id)
    DO UPDATE SET
      response_payload = EXCLUDED.response_payload,
      client_revision  = EXCLUDED.client_revision,
      saved_at         = now()
    WHERE attempt_responses.client_revision < EXCLUDED.client_revision
    RETURNING 1
  )
  SELECT count(*)::int AS rows_affected FROM upserted;
$$;

-- F-01: Pick next scoring job (atomic, skip-locked)
CREATE FUNCTION pick_scoring_job()
RETURNS SETOF scoring_jobs
LANGUAGE sql
AS $$
  UPDATE scoring_jobs SET
    status = 'processing',
    started_at = now()
  WHERE id = (
    SELECT id FROM scoring_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;