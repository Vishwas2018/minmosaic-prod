-- 008_scoring_jobs.sql

CREATE TABLE scoring_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL UNIQUE,
  job_type text NOT NULL DEFAULT 'objective'
    CHECK (job_type IN ('objective', 'writing')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  retries int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 3,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- RLS: service role only
ALTER TABLE scoring_jobs ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated/anon — only service role can access
