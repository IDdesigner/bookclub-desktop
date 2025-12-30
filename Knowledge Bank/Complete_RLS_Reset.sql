-- Complete RLS Reset - Nuclear Option
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Temporarily disable RLS on both tables
-- ============================================================================

ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop ALL policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on students table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON students';
    END LOOP;

    -- Drop all policies on class_students table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'class_students') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON class_students';
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Re-enable RLS
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create simple, non-recursive policies
-- ============================================================================

-- STUDENTS TABLE
-- Allow students to manage their own profile
CREATE POLICY "students_own_profile"
ON students
USING (auth_user_id = auth.uid());

-- Allow teachers (anyone with a class) to read all students
CREATE POLICY "teachers_read_students"
ON students
FOR SELECT
USING (
  auth.uid() IN (SELECT teacher_id FROM classes)
);

-- CLASS_STUDENTS TABLE
-- Allow students to read enrollments where they are the student
CREATE POLICY "students_read_enrollments"
ON class_students
FOR SELECT
USING (
  -- Direct comparison, no subquery on students table
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = class_students.student_id
    AND s.auth_user_id = auth.uid()
  )
);

-- Allow students to insert enrollments for themselves
CREATE POLICY "students_insert_enrollments"
ON class_students
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = class_students.student_id
    AND s.auth_user_id = auth.uid()
  )
);

-- Allow teachers to read enrollments in their classes
CREATE POLICY "teachers_read_enrollments"
ON class_students
FOR SELECT
USING (
  -- Simple check: is this class owned by the current user?
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);

-- Allow teachers to manage enrollments in their classes
CREATE POLICY "teachers_manage_enrollments"
ON class_students
FOR ALL
USING (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
)
WITH CHECK (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);

-- ============================================================================
-- STEP 5: Verify policies
-- ============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename IN ('students', 'class_students')
ORDER BY tablename, policyname;
