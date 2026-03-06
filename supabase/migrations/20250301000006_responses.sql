-- 006_responses.sql

CREATE TABLE attempt_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  item_snapshot_id uuid NOT NULL,
  response_payload jsonb NOT NULL,
  client_revision int NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, item_snapshot_id)
);

-- RLS
ALTER TABLE attempt_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY responses_select_own ON attempt_responses
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
  );

-- All writes via service role (Edge Functions)
