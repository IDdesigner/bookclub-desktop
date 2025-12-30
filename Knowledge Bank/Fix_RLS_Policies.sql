-- Fix RLS Policies for Teacher Dashboard
-- Run this in your Supabase SQL Editor

-- First, let's drop and recreate the problematic policies

-- ============================================================================
-- Drop existing policies that might be causing issues
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can read students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers can read their class enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage their class enrollments" ON class_students;

-- ============================================================================
-- Recreate policies with proper permissions
-- ============================================================================

-- Allow teachers to read students in their classes
CREATE POLICY "Teachers can read students in their classes"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.student_id = students.id
    AND c.teacher_id = auth.uid()
  )
);

-- Allow teachers to read all enrollments in their classes
CREATE POLICY "Teachers can read their class enrollments"
ON class_students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- Allow teachers to insert/update/delete enrollments in their classes
CREATE POLICY "Teachers can manage their class enrollments"
ON class_students
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================

-- Make sure RLS is enabled on these tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Test query (run this after applying the policies)
-- ============================================================================

-- This should return students if you're logged in as a teacher
SELECT
  cs.student_id,
  s.id,
  s.name,
  s.email
FROM class_students cs
JOIN students s ON s.id = cs.student_id
WHERE cs.class_id IN (
  SELECT id FROM classes WHERE teacher_id = auth.uid()
);

-- ============================================================================
-- Alternative: Temporarily disable RLS for debugging
-- ============================================================================
-- ONLY if the above doesn't work, you can temporarily disable RLS to test:
-- (DO NOT leave this disabled in production!)

-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable:
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
