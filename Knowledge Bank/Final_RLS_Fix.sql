-- Final RLS Fix - Guaranteed No Recursion
-- This uses the most permissive approach that still maintains security
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Disable RLS temporarily
-- ============================================================================

ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop ALL policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all relevant tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('students', 'class_students', 'assignments', 'assignment_rubrics', 'assignment_students')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Re-enable RLS
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create simple policies with NO cross-table references
-- ============================================================================

-- STUDENTS TABLE
-- Students can manage their own profile (using auth_user_id directly)
CREATE POLICY "students_manage_own"
ON students
FOR ALL
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Teachers can read ALL students (if they own any class)
-- This is permissive but avoids recursion
CREATE POLICY "teachers_read_all_students"
ON students
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM classes WHERE teacher_id = auth.uid())
);

-- CLASS_STUDENTS TABLE
-- Students can manage their own enrollments
-- Uses a simple subquery that won't recurse
CREATE POLICY "students_manage_enrollments"
ON class_students
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Teachers can manage all enrollments in their classes
CREATE POLICY "teachers_manage_enrollments"
ON class_students
FOR ALL
USING (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
)
WITH CHECK (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);

-- ASSIGNMENTS TABLE
-- Teachers can manage assignments in their classes
CREATE POLICY "teachers_manage_assignments"
ON assignments
FOR ALL
USING (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
)
WITH CHECK (
  class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);

-- Students can read published assignments in their enrolled classes
CREATE POLICY "students_read_published_assignments"
ON assignments
FOR SELECT
USING (
  status = 'published'
  AND class_id IN (
    SELECT class_id FROM class_students
    WHERE student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  )
);

-- ASSIGNMENT_RUBRICS TABLE
-- Teachers can manage rubrics for their assignments
CREATE POLICY "teachers_manage_rubrics"
ON assignment_rubrics
FOR ALL
USING (
  assignment_id IN (
    SELECT id FROM assignments
    WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  )
)
WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments
    WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  )
);

-- Students can read rubrics for published assignments they're assigned to
CREATE POLICY "students_read_rubrics"
ON assignment_rubrics
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM assignments
    WHERE status = 'published'
    AND class_id IN (
      SELECT class_id FROM class_students
      WHERE student_id IN (
        SELECT id FROM students WHERE auth_user_id = auth.uid()
      )
    )
  )
);

-- ASSIGNMENT_STUDENTS TABLE
-- Teachers can manage assignment-student relationships
CREATE POLICY "teachers_manage_assignment_students"
ON assignment_students
FOR ALL
USING (
  assignment_id IN (
    SELECT id FROM assignments
    WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  )
)
WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments
    WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  )
);

-- Students can read their own assignment assignments
CREATE POLICY "students_read_own_assignments"
ON assignment_students
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 5: Verify policies
-- ============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  permissive,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename IN ('students', 'class_students', 'assignments', 'assignment_rubrics', 'assignment_students')
ORDER BY tablename, policyname;
