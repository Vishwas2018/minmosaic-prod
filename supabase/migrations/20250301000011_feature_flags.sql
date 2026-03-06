-- 011_feature_flags.sql

CREATE TABLE feature_flags (
  key text PRIMARY KEY,
  value boolean NOT NULL,
  tier text NOT NULL DEFAULT 'standard' CHECK (tier IN ('critical', 'standard')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Readable by authenticated users (Edge Functions read via service role anyway)
CREATE POLICY flags_select ON feature_flags
  FOR SELECT USING (true);

-- Insert default flags
INSERT INTO feature_flags (key, value, tier) VALUES
  ('maintenance_mode', false, 'critical'),
  ('autosave_enabled', true, 'critical'),
  ('anticheat_auto_submit_enabled', true, 'critical'),
  ('writing_evaluation_enabled', true, 'standard'),
  ('guest_mode_enabled', true, 'standard'),
  ('adaptive_routing_enabled', false, 'standard'),
  ('auto_submit_on_expiry', true, 'standard');
