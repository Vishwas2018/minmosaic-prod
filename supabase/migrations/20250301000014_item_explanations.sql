ALTER TABLE items
ADD COLUMN explanation jsonb;

UPDATE items
SET explanation = '{"text":"Three quarters of 24 is 18 because 24 divided into 4 equal parts is 6, and 3 parts make 18."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-001';

UPDATE items
SET explanation = '{"text":"Area is found by multiplying length by width. 8 times 5 equals 40 square centimetres."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-002';

UPDATE items
SET explanation = '{"text":"4899 is only 101 away from 5000, which is closer than the other options."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-003';

UPDATE items
SET explanation = '{"text":"Starting at 8:00 AM, the first interval is 8:15, the second is 8:30, so the third bus arrives at 8:30 AM."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-004';

UPDATE items
SET explanation = '{"text":"In 3,745, the digit 7 is in the hundreds place, so its value is 700."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-005';

UPDATE items
SET explanation = '{"text":"Each pencil costs 35 cents. 35 multiplied by 6 is 210 cents, which is $2.10."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-006';

UPDATE items
SET explanation = '{"text":"An obtuse angle is greater than 90 degrees and less than 180 degrees. 135 degrees fits that range."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-007';

UPDATE items
SET explanation = '{"text":"A fraction equivalent to 2/5 can be made by multiplying numerator and denominator by the same number. 2/5 becomes 4/10."}'::jsonb
WHERE item_code = 'NUM-Y5-MCQ-008';

UPDATE items
SET explanation = '{"text":"156 plus 278 equals 434."}'::jsonb
WHERE item_code = 'NUM-Y5-SHORT_TEXT-001';

UPDATE items
SET explanation = '{"text":"48 apples shared equally into 6 baskets means 48 divided by 6, which equals 8."}'::jsonb
WHERE item_code = 'NUM-Y5-SHORT_TEXT-002';

UPDATE items
SET explanation = '{"text":"Each number is multiplied by 3: 2, 6, 18, 54, so the next number is 162."}'::jsonb
WHERE item_code = 'NUM-Y5-SHORT_TEXT-003';

UPDATE items
SET explanation = '{"text":"Three quarters written as a decimal is 0.75."}'::jsonb
WHERE item_code = 'NUM-Y5-SHORT_TEXT-004';

UPDATE items
SET explanation = '{"text":"A square has 4 equal sides. 36 divided by 4 equals 9, so each side is 9 cm."}'::jsonb
WHERE item_code = 'NUM-Y5-SHORT_TEXT-005';

UPDATE items
SET explanation = '{"text":"1.5 litres is 1500 millilitres because 1 litre equals 1000 millilitres."}'::jsonb
WHERE item_code = 'NUM-Y5-NUMERIC-001';

UPDATE items
SET explanation = '{"text":"12.6 plus 3.45 equals 16.05. Align the decimal places before adding."}'::jsonb
WHERE item_code = 'NUM-Y5-NUMERIC-002';

UPDATE items
SET explanation = '{"text":"Each bag weighs 2.3 kg. Multiplying 2.3 by 4 gives 9.2 kg."}'::jsonb
WHERE item_code = 'NUM-Y5-NUMERIC-003';

UPDATE items
SET explanation = '{"text":"To round 4,567 to the nearest hundred, look at the tens digit. Because it is 6, round up to 4,600."}'::jsonb
WHERE item_code = 'NUM-Y5-NUMERIC-004';

UPDATE items
SET explanation = '{"text":"Prime numbers have exactly two factors: 1 and themselves. In this list, 2, 11, and 23 are prime."}'::jsonb
WHERE item_code = 'NUM-Y5-MULTI_SELECT-001';

UPDATE items
SET explanation = '{"text":"Squares, rectangles, and trapeziums each have at least one pair of parallel sides. Triangles and circles do not."}'::jsonb
WHERE item_code = 'NUM-Y5-MULTI_SELECT-002';

UPDATE items
SET explanation = '{"text":"A number divisible by both 2 and 3 is divisible by 6. In this list, 6, 12, 18, and 24 meet that rule."}'::jsonb
WHERE item_code = 'NUM-Y5-MULTI_SELECT-003';

UPDATE items
SET explanation = '{"text":"The passage mainly explains how unusual the platypus is, so that is the main idea."}'::jsonb
WHERE item_code = 'READ-Y5-MCQ-001';

UPDATE items
SET explanation = '{"text":"Scientists were surprised because the platypus had features from different animal types, which seemed impossible at first."}'::jsonb
WHERE item_code = 'READ-Y5-MCQ-002';

UPDATE items
SET explanation = '{"text":"In the passage, unusual means not ordinary or uncommon."}'::jsonb
WHERE item_code = 'READ-Y5-MCQ-003';

UPDATE items
SET explanation = '{"text":"A fact is something that can be checked as true. The passage states that the platypus lays eggs."}'::jsonb
WHERE item_code = 'READ-Y5-MCQ-004';

UPDATE items
SET explanation = '{"text":"The passage gives information about the platypus, so its purpose is to inform the reader."}'::jsonb
WHERE item_code = 'READ-Y5-MCQ-005';

UPDATE items
SET explanation = '{"text":"The plural subject dogs needs the plural verb are. That makes the sentence grammatically correct."}'::jsonb
WHERE item_code = 'COL-Y5-MCQ-001';

UPDATE items
SET explanation = '{"text":"The correct spelling is exhausted."}'::jsonb
WHERE item_code = 'COL-Y5-MCQ-002';

UPDATE items
SET explanation = '{"text":"But joins the two parts of the sentence, so it is the conjunction."}'::jsonb
WHERE item_code = 'COL-Y5-MCQ-003';

UPDATE items
SET explanation = '{"text":"The plural of child is children."}'::jsonb
WHERE item_code = 'COL-Y5-SHORT_TEXT-001';

UPDATE items
SET explanation = '{"text":"The past tense of run is ran."}'::jsonb
WHERE item_code = 'COL-Y5-SHORT_TEXT-002';
