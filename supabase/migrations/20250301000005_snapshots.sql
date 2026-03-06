-- 005_snapshots.sql

CREATE TABLE attempt_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  snapshot_data jsonb NOT NULL,
  snapshot_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN attempt_snapshots.snapshot_hash
  IS 'SHA-256 of canonicalized JSON (sorted keys, no whitespace)';

-- Immutability trigger: prevent any updates after creation
CREATE FUNCTION prevent_snapshot_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Snapshots are immutable after creation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_snapshot_immutable
  BEFORE UPDATE ON attempt_snapshots
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_update();

-- RLS
ALTER TABLE attempt_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY snapshots_select_own ON attempt_snapshots
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
  );
