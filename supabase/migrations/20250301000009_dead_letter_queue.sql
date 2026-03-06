-- 009_dead_letter_queue.sql

CREATE TABLE dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  error text,
  payload jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
-- Service role only
