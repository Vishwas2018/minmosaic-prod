-- 002_items.sql
-- Item bank + server-only scoring config
-- Items get auto-generated UUIDs + human-readable item_code (e.g. READ-Y5-MCQ-001)

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE,  -- auto-generated: DOMAIN-YLEVEL-TYPE-SEQ
  domain text NOT NULL CHECK (domain IN ('reading', 'writing', 'col', 'numeracy')),
  year_level int NOT NULL CHECK (year_level IN (3, 5, 7, 9)),
  question_type text NOT NULL CHECK (question_type IN (
    'mcq', 'multi_select', 'short_text', 'numeric',
    'drag_drop', 'inline_dropdown', 'order', 'writing'
  )),
  stem jsonb NOT NULL,
  stimulus jsonb,
  interaction_config jsonb NOT NULL,
  media_refs jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate item_code on insert: READ-Y5-MCQ-001
CREATE FUNCTION generate_item_code()
RETURNS trigger AS $$
DECLARE
  domain_prefix text;
  seq_num int;
BEGIN
  -- Domain → short prefix
  domain_prefix := CASE NEW.domain
    WHEN 'reading' THEN 'READ'
    WHEN 'writing' THEN 'WRIT'
    WHEN 'col'     THEN 'COL'
    WHEN 'numeracy' THEN 'NUM'
  END;

  -- Count existing items in this group + 1
  SELECT count(*) + 1 INTO seq_num
  FROM items
  WHERE domain = NEW.domain
    AND year_level = NEW.year_level
    AND question_type = NEW.question_type;

  NEW.item_code := domain_prefix || '-Y' || NEW.year_level
    || '-' || upper(NEW.question_type)
    || '-' || lpad(seq_num::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_item_code
  BEFORE INSERT ON items
  FOR EACH ROW
  WHEN (NEW.item_code IS NULL)
  EXECUTE FUNCTION generate_item_code();

CREATE TABLE item_scoring_config (
  item_id uuid PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  correct_response jsonb NOT NULL,
  scoring_rules jsonb,
  max_score int NOT NULL DEFAULT 1
);

-- RLS: items readable for published only; scoring config NEVER readable by students
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_scoring_config ENABLE ROW LEVEL SECURITY;

-- Students can read published items (though in practice they only see snapshots)
CREATE POLICY items_select_published ON items
  FOR SELECT USING (status = 'published');

-- NO select policy on item_scoring_config for authenticated/anon
-- Only service role can access scoring config
