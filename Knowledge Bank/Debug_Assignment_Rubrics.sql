-- Debug queries to check assignment and rubric data
-- Run these in your Supabase SQL Editor

-- 1. Check all assignments
SELECT
  id,
  title,
  status,
  created_at
FROM assignments
ORDER BY created_at DESC;

-- 2. Check all rubrics
SELECT
  id,
  assignment_id,
  rubric_title,
  weight,
  what_this_tests,
  order_index
FROM assignment_rubrics
ORDER BY assignment_id, order_index;

-- 3. Check if your specific assignment has rubrics
-- Replace 'YOUR_ASSIGNMENT_ID' with the actual assignment ID
SELECT
  a.id as assignment_id,
  a.title,
  a.status,
  COUNT(ar.id) as rubric_count
FROM assignments a
LEFT JOIN assignment_rubrics ar ON ar.assignment_id = a.id
GROUP BY a.id, a.title, a.status
ORDER BY a.created_at DESC;

-- 4. Full join to see assignment with rubrics
-- Replace 'YOUR_ASSIGNMENT_ID' with the actual assignment ID if you want specific assignment
SELECT
  a.id,
  a.title,
  a.status,
  ar.id as rubric_id,
  ar.rubric_title,
  ar.weight,
  ar.what_this_tests,
  ar.ai_looking_for,
  ar.order_index
FROM assignments a
LEFT JOIN assignment_rubrics ar ON ar.assignment_id = a.id
ORDER BY a.created_at DESC, ar.order_index;

-- 5. Check the schema to verify column names match
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assignment_rubrics'
ORDER BY ordinal_position;
