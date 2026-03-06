-- seed.sql
-- Primary focus: Numeracy Year 5 (20 items across 4 question types)
-- Other domains: placeholder items (5 each) for future expansion
--
-- Run via: supabase db reset

CREATE TEMP TABLE _seed (
  row_id serial PRIMARY KEY,
  domain text,
  year_level int,
  question_type text,
  stem jsonb,
  stimulus jsonb,
  interaction_config jsonb,
  correct_response jsonb,
  scoring_rules jsonb,
  max_score int DEFAULT 1,
  item_id uuid
);

-- ═══════════════════════════════════════════════════════════════
-- NUMERACY — Year 5 — 20 items (primary test domain)
-- ═══════════════════════════════════════════════════════════════

-- ─── MCQ (8) ─────────────────────────────────────────────────

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response) VALUES

('numeracy', 5, 'mcq',
 '{"text": "What is 3/4 of 24?"}',
 NULL,
 '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "12"}, {"id": "c", "label": "18"}, {"id": "d", "label": "20"}]}',
 '{"correct_option_id": "c"}'),

('numeracy', 5, 'mcq',
 '{"text": "A rectangle has a length of 8 cm and a width of 5 cm. What is its area?"}',
 NULL,
 '{"options": [{"id": "a", "label": "13 cm²"}, {"id": "b", "label": "26 cm²"}, {"id": "c", "label": "40 cm²"}, {"id": "d", "label": "45 cm²"}]}',
 '{"correct_option_id": "c"}'),

('numeracy', 5, 'mcq',
 '{"text": "Which number is closest to 5000?"}',
 NULL,
 '{"options": [{"id": "a", "label": "4899"}, {"id": "b", "label": "5120"}, {"id": "c", "label": "4500"}, {"id": "d", "label": "5501"}]}',
 '{"correct_option_id": "a"}'),

('numeracy', 5, 'mcq',
 '{"text": "If a bus arrives every 15 minutes starting at 8:00 AM, what time does the third bus arrive?"}',
 NULL,
 '{"options": [{"id": "a", "label": "8:15 AM"}, {"id": "b", "label": "8:30 AM"}, {"id": "c", "label": "8:45 AM"}, {"id": "d", "label": "9:00 AM"}]}',
 '{"correct_option_id": "b"}'),

('numeracy', 5, 'mcq',
 '{"text": "What is the value of the 7 in 3,745?"}',
 NULL,
 '{"options": [{"id": "a", "label": "7"}, {"id": "b", "label": "70"}, {"id": "c", "label": "700"}, {"id": "d", "label": "7000"}]}',
 '{"correct_option_id": "c"}'),

('numeracy', 5, 'mcq',
 '{"text": "A shop sells pencils for 35 cents each. How much do 6 pencils cost?"}',
 NULL,
 '{"options": [{"id": "a", "label": "$1.80"}, {"id": "b", "label": "$2.10"}, {"id": "c", "label": "$2.40"}, {"id": "d", "label": "$1.50"}]}',
 '{"correct_option_id": "b"}'),

('numeracy', 5, 'mcq',
 '{"text": "What type of angle is 135°?"}',
 NULL,
 '{"options": [{"id": "a", "label": "Acute"}, {"id": "b", "label": "Right"}, {"id": "c", "label": "Obtuse"}, {"id": "d", "label": "Reflex"}]}',
 '{"correct_option_id": "c"}'),

('numeracy', 5, 'mcq',
 '{"text": "Which fraction is equivalent to 2/5?"}',
 NULL,
 '{"options": [{"id": "a", "label": "3/10"}, {"id": "b", "label": "4/10"}, {"id": "c", "label": "4/5"}, {"id": "d", "label": "2/10"}]}',
 '{"correct_option_id": "b"}');

-- ─── SHORT TEXT (5) ──────────────────────────────────────────

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response) VALUES

('numeracy', 5, 'short_text',
 '{"text": "What is 156 + 278?"}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "434"}'),

('numeracy', 5, 'short_text',
 '{"text": "A farmer has 48 apples split equally into 6 baskets. How many per basket?"}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "8"}'),

('numeracy', 5, 'short_text',
 '{"text": "What is the next number in this pattern? 2, 6, 18, 54, ___"}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "162"}'),

('numeracy', 5, 'short_text',
 '{"text": "Write 3/4 as a decimal."}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "0.75"}'),

('numeracy', 5, 'short_text',
 '{"text": "A square has a perimeter of 36 cm. What is the length of one side?"}',
 NULL,
 '{"placeholder": "Type your answer (cm)"}',
 '{"text": "9"}');

-- ─── NUMERIC (4) — scored with tolerance ─────────────────────
-- scoring_rules.tolerance defines acceptable range around correct value

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response, scoring_rules) VALUES

('numeracy', 5, 'numeric',
 '{"text": "A jug holds 1.5 litres. How many millilitres is that?"}',
 NULL,
 '{"placeholder": "Type a number", "unit": "mL", "allow_decimals": false}',
 '{"value": 1500}',
 '{"tolerance": 0}'),

('numeracy', 5, 'numeric',
 '{"text": "What is 12.6 + 3.45?"}',
 NULL,
 '{"placeholder": "Type a number", "allow_decimals": true}',
 '{"value": 16.05}',
 '{"tolerance": 0.01}'),

('numeracy', 5, 'numeric',
 '{"text": "A bag of rice weighs 2.3 kg. How much do 4 bags weigh?"}',
 NULL,
 '{"placeholder": "Type a number", "unit": "kg", "allow_decimals": true}',
 '{"value": 9.2}',
 '{"tolerance": 0.1}'),

('numeracy', 5, 'numeric',
 '{"text": "Round 4,567 to the nearest hundred."}',
 NULL,
 '{"placeholder": "Type a number", "allow_decimals": false}',
 '{"value": 4600}',
 '{"tolerance": 0}');

-- ─── MULTI SELECT (3) — select all correct answers ──────────

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response) VALUES

('numeracy', 5, 'multi_select',
 '{"text": "Select ALL the prime numbers from this list."}',
 NULL,
 '{"options": [{"id": "a", "label": "2"}, {"id": "b", "label": "9"}, {"id": "c", "label": "11"}, {"id": "d", "label": "15"}, {"id": "e", "label": "23"}], "min_selections": 1, "max_selections": 5}',
 '{"correct_option_ids": ["a", "c", "e"]}'),

('numeracy', 5, 'multi_select',
 '{"text": "Which of these shapes have at least one pair of parallel sides? Select ALL that apply."}',
 NULL,
 '{"options": [{"id": "a", "label": "Square"}, {"id": "b", "label": "Triangle"}, {"id": "c", "label": "Rectangle"}, {"id": "d", "label": "Trapezium"}, {"id": "e", "label": "Circle"}], "min_selections": 1, "max_selections": 5}',
 '{"correct_option_ids": ["a", "c", "d"]}'),

('numeracy', 5, 'multi_select',
 '{"text": "Select ALL the numbers that are divisible by both 2 and 3."}',
 NULL,
 '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "8"}, {"id": "c", "label": "12"}, {"id": "d", "label": "15"}, {"id": "e", "label": "18"}, {"id": "f", "label": "24"}], "min_selections": 1, "max_selections": 6}',
 '{"correct_option_ids": ["a", "c", "e", "f"]}');


-- ═══════════════════════════════════════════════════════════════
-- READING — Year 5 — placeholder (5 MCQ)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response) VALUES

('reading', 5, 'mcq',
 '{"text": "What is the main idea of the passage?"}',
 '{"text": "The platypus is one of Australia''s most unusual animals. It has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
 '{"options": [{"id": "a", "label": "Platypuses are dangerous"}, {"id": "b", "label": "The platypus is very unusual"}, {"id": "c", "label": "Scientists enjoy tricks"}, {"id": "d", "label": "Ducks and beavers are related"}]}',
 '{"correct_option_id": "b"}'),

('reading', 5, 'mcq',
 '{"text": "Why were scientists surprised by the platypus?"}',
 '{"text": "Scientists were so surprised when they first saw a platypus that they thought someone was playing a trick on them."}',
 '{"options": [{"id": "a", "label": "It could swim fast"}, {"id": "b", "label": "It had features of different animal types"}, {"id": "c", "label": "It was very large"}, {"id": "d", "label": "It could fly"}]}',
 '{"correct_option_id": "b"}'),

('reading', 5, 'mcq',
 '{"text": "What does ''unusual'' mean in this passage?"}',
 '{"text": "The platypus is one of Australia''s most unusual animals."}',
 '{"options": [{"id": "a", "label": "Common"}, {"id": "b", "label": "Dangerous"}, {"id": "c", "label": "Not ordinary"}, {"id": "d", "label": "Very small"}]}',
 '{"correct_option_id": "c"}'),

('reading', 5, 'mcq',
 '{"text": "Which is a fact from the passage?"}',
 '{"text": "The platypus has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
 '{"options": [{"id": "a", "label": "Platypuses are the best animal"}, {"id": "b", "label": "The platypus lays eggs"}, {"id": "c", "label": "Platypuses live everywhere"}, {"id": "d", "label": "Scientists love platypuses"}]}',
 '{"correct_option_id": "b"}'),

('reading', 5, 'mcq',
 '{"text": "The passage is mostly written to:"}',
 '{"text": "The platypus is one of Australia''s most unusual animals. It has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
 '{"options": [{"id": "a", "label": "Persuade people to protect platypuses"}, {"id": "b", "label": "Inform readers about the platypus"}, {"id": "c", "label": "Entertain with a funny story"}, {"id": "d", "label": "Instruct how to find a platypus"}]}',
 '{"correct_option_id": "b"}');


-- ═══════════════════════════════════════════════════════════════
-- CONVENTIONS OF LANGUAGE — Year 5 — placeholder (5 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO _seed (domain, year_level, question_type, stem, stimulus, interaction_config, correct_response) VALUES

('col', 5, 'mcq',
 '{"text": "Which sentence is written correctly?"}',
 NULL,
 '{"options": [{"id": "a", "label": "The dogs is playing in the park."}, {"id": "b", "label": "The dogs are playing in the park."}, {"id": "c", "label": "The dogs are play in the park."}, {"id": "d", "label": "The dogs is play in the park."}]}',
 '{"correct_option_id": "b"}'),

('col', 5, 'mcq',
 '{"text": "Choose the correct spelling: The children were very _____ after the long run."}',
 NULL,
 '{"options": [{"id": "a", "label": "exausted"}, {"id": "b", "label": "exhuasted"}, {"id": "c", "label": "exhausted"}, {"id": "d", "label": "exhosted"}]}',
 '{"correct_option_id": "c"}'),

('col', 5, 'mcq',
 '{"text": "Which word is a conjunction? ''Sam wanted to go outside, but it was raining.''"}',
 NULL,
 '{"options": [{"id": "a", "label": "wanted"}, {"id": "b", "label": "but"}, {"id": "c", "label": "outside"}, {"id": "d", "label": "raining"}]}',
 '{"correct_option_id": "b"}'),

('col', 5, 'short_text',
 '{"text": "Write the plural form of the word ''child''."}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "children"}'),

('col', 5, 'short_text',
 '{"text": "Write the past tense of the word ''run''."}',
 NULL,
 '{"placeholder": "Type your answer"}',
 '{"text": "ran"}');


-- ═══════════════════════════════════════════════════════════════
-- Insert into real tables (UUIDs + item_codes auto-generated)
-- ═══════════════════════════════════════════════════════════════

WITH inserted AS (
  INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
  SELECT domain, year_level, question_type, stem, stimulus, interaction_config, 'published'
  FROM _seed
  ORDER BY row_id
  RETURNING id, domain, year_level, question_type, stem
)
UPDATE _seed s
SET item_id = i.id
FROM inserted i
WHERE s.domain = i.domain
  AND s.year_level = i.year_level
  AND s.question_type = i.question_type
  AND s.stem = i.stem;


-- ═══════════════════════════════════════════════════════════════
-- Insert scoring configs (auto-linked)
-- scoring_rules holds tolerance for numeric, NULL for others
-- ═══════════════════════════════════════════════════════════════

INSERT INTO item_scoring_config (item_id, correct_response, scoring_rules, max_score)
SELECT item_id, correct_response, scoring_rules, max_score
FROM _seed
WHERE item_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════
-- Clean up
-- ═══════════════════════════════════════════════════════════════

DROP TABLE _seed;
