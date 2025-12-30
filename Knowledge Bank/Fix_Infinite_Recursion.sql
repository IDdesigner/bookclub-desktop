-- Fix Infinite Recursion in RLS Policies
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Drop ALL existing policies on students and class_students tables
-- ============================================================================

DROP POLICY IF EXISTS "Students can read their own profile" ON students;
DROP POLICY IF EXISTS "Students can create their own profile" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can read students in their classes" ON students;

DROP POLICY IF EXISTS "Students can read their own enrollments" ON class_students;
DROP POLICY IF EXISTS "Students can join classes" ON class_students;
DROP POLICY IF EXISTS "Teachers can read their class enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage their class enrollments" ON class_students;

-- ============================================================================
-- Create SIMPLER policies without recursion
-- ============================================================================

-- STUDENTS TABLE POLICIES
-- ------------------------

-- Students can manage their own profile (using auth_user_id)
CREATE POLICY "Students can manage own profile"
ON students
FOR ALL
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Teachers can read ANY student (simpler, no recursion)
-- We'll filter by class in the application layer
CREATE POLICY "Teachers can read all students"
ON students
FOR SELECT
USING (
  -- User is a teacher (exists in classes table as teacher_id)
  EXISTS (
    SELECT 1 FROM classes
    WHERE teacher_id = auth.uid()
  )
);

-- CLASS_STUDENTS TABLE POLICIES
-- ------------------------------

-- Students can read their own enrollments
CREATE POLICY "Students read own enrollments"
ON class_students
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Students can insert their own enrollments (when joining a class)
CREATE POLICY "Students insert own enrollments"
ON class_students
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Teachers can read all enrollments in their classes
CREATE POLICY "Teachers read class enrollments"
ON class_students
FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);

-- Teachers can manage (insert/update/delete) enrollments in their classes
CREATE POLICY "Teachers manage class enrollments"
ON class_students
FOR ALL
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
)
WITH CHECK (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);

-- ============================================================================
-- Verify policies were created
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('students', 'class_students')
ORDER BY tablename, policyname;
