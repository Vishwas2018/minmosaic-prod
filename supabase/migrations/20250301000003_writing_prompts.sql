-- 003_writing_prompts.sql

CREATE TABLE writing_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_level int NOT NULL CHECK (year_level IN (3, 5, 7, 9)),
  genre text NOT NULL CHECK (genre IN ('narrative', 'persuasive')),
  stimulus jsonb NOT NULL,
  task_instruction text NOT NULL,
  media_refs jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE writing_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY writing_prompts_select_published ON writing_prompts
  FOR SELECT USING (status = 'published');
