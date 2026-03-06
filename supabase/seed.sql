-- seed.sql
-- Wrapped in a single DO $$ block so the Supabase CLI treats it as
-- one statement. This avoids batch-splitting issues with temp tables.
--
-- Apply via the Supabase Dashboard SQL Editor against the cloud project.

DO $$
DECLARE
  v_item_id uuid;
BEGIN

-- ═══════════════════════════════════════════════════════════════
-- NUMERACY — Year 5 — MCQ (8 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "What is 3/4 of 24?"}', NULL,
  '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "12"}, {"id": "c", "label": "18"}, {"id": "d", "label": "20"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "A rectangle has a length of 8 cm and a width of 5 cm. What is its area?"}', NULL,
  '{"options": [{"id": "a", "label": "13 cm²"}, {"id": "b", "label": "26 cm²"}, {"id": "c", "label": "40 cm²"}, {"id": "d", "label": "45 cm²"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "Which number is closest to 5000?"}', NULL,
  '{"options": [{"id": "a", "label": "4899"}, {"id": "b", "label": "5120"}, {"id": "c", "label": "4500"}, {"id": "d", "label": "5501"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "a"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "If a bus arrives every 15 minutes starting at 8:00 AM, what time does the third bus arrive?"}', NULL,
  '{"options": [{"id": "a", "label": "8:15 AM"}, {"id": "b", "label": "8:30 AM"}, {"id": "c", "label": "8:45 AM"}, {"id": "d", "label": "9:00 AM"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "What is the value of the 7 in 3,745?"}', NULL,
  '{"options": [{"id": "a", "label": "7"}, {"id": "b", "label": "70"}, {"id": "c", "label": "700"}, {"id": "d", "label": "7000"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "A shop sells pencils for 35 cents each. How much do 6 pencils cost?"}', NULL,
  '{"options": [{"id": "a", "label": "$1.80"}, {"id": "b", "label": "$2.10"}, {"id": "c", "label": "$2.40"}, {"id": "d", "label": "$1.50"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "What type of angle is 135°?"}', NULL,
  '{"options": [{"id": "a", "label": "Acute"}, {"id": "b", "label": "Right"}, {"id": "c", "label": "Obtuse"}, {"id": "d", "label": "Reflex"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'mcq', '{"text": "Which fraction is equivalent to 2/5?"}', NULL,
  '{"options": [{"id": "a", "label": "3/10"}, {"id": "b", "label": "4/10"}, {"id": "c", "label": "4/5"}, {"id": "d", "label": "2/10"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

-- ═══════════════════════════════════════════════════════════════
-- NUMERACY — Year 5 — SHORT TEXT (5 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'short_text', '{"text": "What is 156 + 278?"}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "434"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'short_text', '{"text": "A farmer has 48 apples split equally into 6 baskets. How many per basket?"}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "8"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'short_text', '{"text": "What is the next number in this pattern? 2, 6, 18, 54, ___"}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "162"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'short_text', '{"text": "Write 3/4 as a decimal."}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "0.75"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'short_text', '{"text": "A square has a perimeter of 36 cm. What is the length of one side?"}', NULL,
  '{"placeholder": "Type your answer (cm)"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "9"}', 1);

-- ═══════════════════════════════════════════════════════════════
-- NUMERACY — Year 5 — NUMERIC (4 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'numeric', '{"text": "A jug holds 1.5 litres. How many millilitres is that?"}', NULL,
  '{"placeholder": "Type a number", "unit": "mL", "allow_decimals": false}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, scoring_rules, max_score) VALUES (v_item_id, '{"value": 1500}', '{"tolerance": 0}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'numeric', '{"text": "What is 12.6 + 3.45?"}', NULL,
  '{"placeholder": "Type a number", "allow_decimals": true}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, scoring_rules, max_score) VALUES (v_item_id, '{"value": 16.05}', '{"tolerance": 0.01}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'numeric', '{"text": "A bag of rice weighs 2.3 kg. How much do 4 bags weigh?"}', NULL,
  '{"placeholder": "Type a number", "unit": "kg", "allow_decimals": true}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, scoring_rules, max_score) VALUES (v_item_id, '{"value": 9.2}', '{"tolerance": 0.1}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'numeric', '{"text": "Round 4,567 to the nearest hundred."}', NULL,
  '{"placeholder": "Type a number", "allow_decimals": false}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, scoring_rules, max_score) VALUES (v_item_id, '{"value": 4600}', '{"tolerance": 0}', 1);

-- ═══════════════════════════════════════════════════════════════
-- NUMERACY — Year 5 — MULTI SELECT (3 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'multi_select', '{"text": "Select ALL the prime numbers from this list."}', NULL,
  '{"options": [{"id": "a", "label": "2"}, {"id": "b", "label": "9"}, {"id": "c", "label": "11"}, {"id": "d", "label": "15"}, {"id": "e", "label": "23"}], "min_selections": 1, "max_selections": 5}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_ids": ["a", "c", "e"]}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'multi_select', '{"text": "Which of these shapes have at least one pair of parallel sides? Select ALL that apply."}', NULL,
  '{"options": [{"id": "a", "label": "Square"}, {"id": "b", "label": "Triangle"}, {"id": "c", "label": "Rectangle"}, {"id": "d", "label": "Trapezium"}, {"id": "e", "label": "Circle"}], "min_selections": 1, "max_selections": 5}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_ids": ["a", "c", "d"]}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('numeracy', 5, 'multi_select', '{"text": "Select ALL the numbers that are divisible by both 2 and 3."}', NULL,
  '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "8"}, {"id": "c", "label": "12"}, {"id": "d", "label": "15"}, {"id": "e", "label": "18"}, {"id": "f", "label": "24"}], "min_selections": 1, "max_selections": 6}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_ids": ["a", "c", "e", "f"]}', 1);

-- ═══════════════════════════════════════════════════════════════
-- READING — Year 5 — MCQ (5 items)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('reading', 5, 'mcq', '{"text": "What is the main idea of the passage?"}',
  '{"text": "The platypus is one of Australia''s most unusual animals. It has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
  '{"options": [{"id": "a", "label": "Platypuses are dangerous"}, {"id": "b", "label": "The platypus is very unusual"}, {"id": "c", "label": "Scientists enjoy tricks"}, {"id": "d", "label": "Ducks and beavers are related"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('reading', 5, 'mcq', '{"text": "Why were scientists surprised by the platypus?"}',
  '{"text": "Scientists were so surprised when they first saw a platypus that they thought someone was playing a trick on them."}',
  '{"options": [{"id": "a", "label": "It could swim fast"}, {"id": "b", "label": "It had features of different animal types"}, {"id": "c", "label": "It was very large"}, {"id": "d", "label": "It could fly"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('reading', 5, 'mcq', '{"text": "What does unusual mean in this passage?"}',
  '{"text": "The platypus is one of Australia''s most unusual animals."}',
  '{"options": [{"id": "a", "label": "Common"}, {"id": "b", "label": "Dangerous"}, {"id": "c", "label": "Not ordinary"}, {"id": "d", "label": "Very small"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('reading', 5, 'mcq', '{"text": "Which is a fact from the passage?"}',
  '{"text": "The platypus has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
  '{"options": [{"id": "a", "label": "Platypuses are the best animal"}, {"id": "b", "label": "The platypus lays eggs"}, {"id": "c", "label": "Platypuses live everywhere"}, {"id": "d", "label": "Scientists love platypuses"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('reading', 5, 'mcq', '{"text": "The passage is mostly written to:"}',
  '{"text": "The platypus is one of Australia''s most unusual animals. It has a bill like a duck, a tail like a beaver, and it lays eggs even though it is a mammal."}',
  '{"options": [{"id": "a", "label": "Persuade people to protect platypuses"}, {"id": "b", "label": "Inform readers about the platypus"}, {"id": "c", "label": "Entertain with a funny story"}, {"id": "d", "label": "Instruct how to find a platypus"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

-- ═══════════════════════════════════════════════════════════════
-- CONVENTIONS OF LANGUAGE — Year 5 (3 MCQ + 2 SHORT TEXT)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('col', 5, 'mcq', '{"text": "Which sentence is written correctly?"}', NULL,
  '{"options": [{"id": "a", "label": "The dogs is playing in the park."}, {"id": "b", "label": "The dogs are playing in the park."}, {"id": "c", "label": "The dogs are play in the park."}, {"id": "d", "label": "The dogs is play in the park."}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('col', 5, 'mcq', '{"text": "Choose the correct spelling: The children were very _____ after the long run."}', NULL,
  '{"options": [{"id": "a", "label": "exausted"}, {"id": "b", "label": "exhuasted"}, {"id": "c", "label": "exhausted"}, {"id": "d", "label": "exhosted"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "c"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('col', 5, 'mcq', '{"text": "Which word is a conjunction in: Sam wanted to go outside, but it was raining."}', NULL,
  '{"options": [{"id": "a", "label": "wanted"}, {"id": "b", "label": "but"}, {"id": "c", "label": "outside"}, {"id": "d", "label": "raining"}]}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"correct_option_id": "b"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('col', 5, 'short_text', '{"text": "Write the plural form of the word child."}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "children"}', 1);

INSERT INTO items (domain, year_level, question_type, stem, stimulus, interaction_config, status)
VALUES ('col', 5, 'short_text', '{"text": "Write the past tense of the word run."}', NULL,
  '{"placeholder": "Type your answer"}', 'published')
RETURNING id INTO v_item_id;
INSERT INTO item_scoring_config (item_id, correct_response, max_score) VALUES (v_item_id, '{"text": "ran"}', 1);

UPDATE items SET explanation = '{"text":"Three quarters of 24 is 18 because 24 divided into 4 equal parts is 6, and 3 parts make 18."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-001';
UPDATE items SET explanation = '{"text":"Area is found by multiplying length by width. 8 times 5 equals 40 square centimetres."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-002';
UPDATE items SET explanation = '{"text":"4899 is only 101 away from 5000, which is closer than the other options."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-003';
UPDATE items SET explanation = '{"text":"Starting at 8:00 AM, the first interval is 8:15, the second is 8:30, so the third bus arrives at 8:30 AM."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-004';
UPDATE items SET explanation = '{"text":"In 3,745, the digit 7 is in the hundreds place, so its value is 700."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-005';
UPDATE items SET explanation = '{"text":"Each pencil costs 35 cents. 35 multiplied by 6 is 210 cents, which is $2.10."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-006';
UPDATE items SET explanation = '{"text":"An obtuse angle is greater than 90 degrees and less than 180 degrees. 135 degrees fits that range."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-007';
UPDATE items SET explanation = '{"text":"A fraction equivalent to 2/5 can be made by multiplying numerator and denominator by the same number. 2/5 becomes 4/10."}'::jsonb WHERE item_code = 'NUM-Y5-MCQ-008';
UPDATE items SET explanation = '{"text":"156 plus 278 equals 434."}'::jsonb WHERE item_code = 'NUM-Y5-SHORT_TEXT-001';
UPDATE items SET explanation = '{"text":"48 apples shared equally into 6 baskets means 48 divided by 6, which equals 8."}'::jsonb WHERE item_code = 'NUM-Y5-SHORT_TEXT-002';
UPDATE items SET explanation = '{"text":"Each number is multiplied by 3: 2, 6, 18, 54, so the next number is 162."}'::jsonb WHERE item_code = 'NUM-Y5-SHORT_TEXT-003';
UPDATE items SET explanation = '{"text":"Three quarters written as a decimal is 0.75."}'::jsonb WHERE item_code = 'NUM-Y5-SHORT_TEXT-004';
UPDATE items SET explanation = '{"text":"A square has 4 equal sides. 36 divided by 4 equals 9, so each side is 9 cm."}'::jsonb WHERE item_code = 'NUM-Y5-SHORT_TEXT-005';
UPDATE items SET explanation = '{"text":"1.5 litres is 1500 millilitres because 1 litre equals 1000 millilitres."}'::jsonb WHERE item_code = 'NUM-Y5-NUMERIC-001';
UPDATE items SET explanation = '{"text":"12.6 plus 3.45 equals 16.05. Align the decimal places before adding."}'::jsonb WHERE item_code = 'NUM-Y5-NUMERIC-002';
UPDATE items SET explanation = '{"text":"Each bag weighs 2.3 kg. Multiplying 2.3 by 4 gives 9.2 kg."}'::jsonb WHERE item_code = 'NUM-Y5-NUMERIC-003';
UPDATE items SET explanation = '{"text":"To round 4,567 to the nearest hundred, look at the tens digit. Because it is 6, round up to 4,600."}'::jsonb WHERE item_code = 'NUM-Y5-NUMERIC-004';
UPDATE items SET explanation = '{"text":"Prime numbers have exactly two factors: 1 and themselves. In this list, 2, 11, and 23 are prime."}'::jsonb WHERE item_code = 'NUM-Y5-MULTI_SELECT-001';
UPDATE items SET explanation = '{"text":"Squares, rectangles, and trapeziums each have at least one pair of parallel sides. Triangles and circles do not."}'::jsonb WHERE item_code = 'NUM-Y5-MULTI_SELECT-002';
UPDATE items SET explanation = '{"text":"A number divisible by both 2 and 3 is divisible by 6. In this list, 6, 12, 18, and 24 meet that rule."}'::jsonb WHERE item_code = 'NUM-Y5-MULTI_SELECT-003';
UPDATE items SET explanation = '{"text":"The passage mainly explains how unusual the platypus is, so that is the main idea."}'::jsonb WHERE item_code = 'READ-Y5-MCQ-001';
UPDATE items SET explanation = '{"text":"Scientists were surprised because the platypus had features from different animal types, which seemed impossible at first."}'::jsonb WHERE item_code = 'READ-Y5-MCQ-002';
UPDATE items SET explanation = '{"text":"In the passage, unusual means not ordinary or uncommon."}'::jsonb WHERE item_code = 'READ-Y5-MCQ-003';
UPDATE items SET explanation = '{"text":"A fact is something that can be checked as true. The passage states that the platypus lays eggs."}'::jsonb WHERE item_code = 'READ-Y5-MCQ-004';
UPDATE items SET explanation = '{"text":"The passage gives information about the platypus, so its purpose is to inform the reader."}'::jsonb WHERE item_code = 'READ-Y5-MCQ-005';
UPDATE items SET explanation = '{"text":"The plural subject dogs needs the plural verb are. That makes the sentence grammatically correct."}'::jsonb WHERE item_code = 'COL-Y5-MCQ-001';
UPDATE items SET explanation = '{"text":"The correct spelling is exhausted."}'::jsonb WHERE item_code = 'COL-Y5-MCQ-002';
UPDATE items SET explanation = '{"text":"But joins the two parts of the sentence, so it is the conjunction."}'::jsonb WHERE item_code = 'COL-Y5-MCQ-003';
UPDATE items SET explanation = '{"text":"The plural of child is children."}'::jsonb WHERE item_code = 'COL-Y5-SHORT_TEXT-001';
UPDATE items SET explanation = '{"text":"The past tense of run is ran."}'::jsonb WHERE item_code = 'COL-Y5-SHORT_TEXT-002';

END $$;
