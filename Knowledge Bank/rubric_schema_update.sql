-- Migration: Update assignment_rubrics table with detailed scoring criteria and AI guidance
-- Run this in your Supabase SQL Editor

-- Step 1: Rename objective_name to rubric_title
ALTER TABLE assignment_rubrics
RENAME COLUMN objective_name TO rubric_title;

-- Step 2: Add new fields for rubric details
ALTER TABLE assignment_rubrics
ADD COLUMN what_this_tests TEXT,
ADD COLUMN ai_looking_for TEXT,
ADD COLUMN strong_mastery TEXT,
ADD COLUMN adequate TEXT,
ADD COLUMN emerging TEXT,
ADD COLUMN minimal TEXT,
ADD COLUMN no_evidence TEXT,
ADD COLUMN example_ai_followup_if_weak TEXT;

-- Step 3: Update the description column comment for clarity
COMMENT ON COLUMN assignment_rubrics.description IS 'Optional general description of the rubric';
COMMENT ON COLUMN assignment_rubrics.what_this_tests IS 'Description of what learning objective this rubric tests';
COMMENT ON COLUMN assignment_rubrics.ai_looking_for IS 'What the AI tutor should look for when evaluating';
COMMENT ON COLUMN assignment_rubrics.strong_mastery IS 'Score guide: criteria for strong mastery';
COMMENT ON COLUMN assignment_rubrics.adequate IS 'Score guide: criteria for adequate performance';
COMMENT ON COLUMN assignment_rubrics.emerging IS 'Score guide: criteria for emerging understanding';
COMMENT ON COLUMN assignment_rubrics.minimal IS 'Score guide: criteria for minimal understanding';
COMMENT ON COLUMN assignment_rubrics.no_evidence IS 'Score guide: criteria for no evidence of understanding';
COMMENT ON COLUMN assignment_rubrics.example_ai_followup_if_weak IS 'Example follow-up question or prompt if student performance is weak';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignment_rubrics'
ORDER BY ordinal_position;
