-- 007_results.sql

CREATE TABLE attempt_results (
  attempt_id uuid PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  domain text,
  year_level int,
  total_items int NOT NULL,
  correct_count int NOT NULL,
  score_raw numeric NOT NULL,
  score_pct numeric NOT NULL,
  band_estimate text,
  engine_version text NOT NULL,
  scored_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attempt_item_results (
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  item_snapshot_id uuid NOT NULL,
  is_correct boolean NOT NULL,
  score_awarded numeric NOT NULL,
  max_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, item_snapshot_id)
);

CREATE TABLE writing_results (
  attempt_id uuid PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  overall_band text,
  criterion_scores jsonb,
  evaluator_version text,
  flagged_content boolean NOT NULL DEFAULT false,
  scored_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE attempt_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_item_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY results_select_own ON attempt_results
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
  );

CREATE POLICY item_results_select_own ON attempt_item_results
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
  );

CREATE POLICY writing_results_select_own ON writing_results
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
  );
