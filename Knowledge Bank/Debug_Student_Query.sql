-- Debug queries to check why students aren't showing up
-- Run these in your Supabase SQL Editor while logged in as the teacher

-- 1. Check if students exist in the students table
SELECT * FROM students;

-- 2. Check class_students junction table
SELECT * FROM class_students;

-- 3. Check if the join query works
SELECT
  cs.class_id,
  cs.student_id,
  s.id,
  s.name,
  s.email,
  s.created_at
FROM class_students cs
JOIN students s ON s.id = cs.student_id;

-- 4. Check for a specific class (replace with your actual class_id)
SELECT
  cs.student_id,
  s.*
FROM class_students cs
JOIN students s ON s.id = cs.student_id
WHERE cs.class_id = 'YOUR_CLASS_ID_HERE';

-- 5. Check RLS policies on students table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'students';

-- 6. Check if teacher can see their own classes
SELECT * FROM classes WHERE teacher_id = auth.uid();

-- 7. Try the exact query from classStore
SELECT
  cs.student_id,
  s.id,
  s.name,
  s.email,
  s.created_at
FROM class_students cs
LEFT JOIN students s ON s.id = cs.student_id
WHERE cs.class_id = 'YOUR_CLASS_ID_HERE';
