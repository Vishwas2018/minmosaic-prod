-- 004_attempts.sql

CREATE TABLE attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  domain text NOT NULL CHECK (domain IN ('reading', 'writing', 'col', 'numeracy')),
  year_level int NOT NULL CHECK (year_level IN (3, 5, 7, 9)),
  status text NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'started', 'in_progress', 'submitted',
    'scored', 'expired', 'abandoned', 'invalidated'
  )),
  time_limit_sec int NOT NULL DEFAULT 2700,
  started_at timestamptz,
  expires_at timestamptz,
  submitted_at timestamptz,
  scored_at timestamptz,
  expired_at timestamptz,
  abandoned_at timestamptz,
  invalidated_at timestamptz,
  invalidated_by uuid,
  invalidated_reason text,
  auto_submitted boolean NOT NULL DEFAULT false,
  auto_submit_reason text,
  submission_id uuid UNIQUE,
  snapshot_hash text,
  engine_version text,
  randomization_seed text,
  -- Guest fields (Phase 3)
  guest_device_id text,
  attempt_secret_hash text,
  attempt_secret_expires_at timestamptz,
  guest_verify_failures int NOT NULL DEFAULT 0,
  -- Anti-cheat counters
  focus_loss_count int NOT NULL DEFAULT 0,
  fullscreen_exit_count int NOT NULL DEFAULT 0,
  context_menu_count int NOT NULL DEFAULT 0,
  last_processed_event_seq int NOT NULL DEFAULT 0,
  last_warning_type text,
  last_warning_at timestamptz,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY attempts_select_own ON attempts
  FOR SELECT USING (auth.uid() = user_id);

-- All writes via service role (Edge Functions) — no INSERT/UPDATE/DELETE for authenticated
