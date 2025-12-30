-- =====================================================
-- BOOK CLUB - Classes & Assignments Schema
-- Supabase SQL Setup Script
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  invite_code VARCHAR(9) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class-Student junction table (many-to-many)
CREATE TABLE IF NOT EXISTS class_students (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  source VARCHAR(255), -- "uploaded", "pasted", "project_gutenberg", etc.
  public_domain_bool BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title VARCHAR(500),
  source_text_ref TEXT, -- Reference to storage bucket or inline text
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ingested', 'published'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Content source
  content_source VARCHAR(50) NOT NULL, -- 'existing-book' or 'paste-text'
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  chapter_ids UUID[], -- Array of chapter IDs if using existing book
  pasted_text TEXT, -- Direct text if paste-text option
  page_start INTEGER,
  page_end INTEGER,

  -- AI Tutor settings
  ai_voice VARCHAR(50) DEFAULT 'supportive', -- 'supportive', 'strict', 'playful'
  ai_tone VARCHAR(50) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  evidence_required BOOLEAN DEFAULT true,

  -- Assignment details
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment-Student junction table (which students are assigned)
CREATE TABLE IF NOT EXISTS assignment_students (
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (assignment_id, student_id)
);

-- Assignment Rubrics table
CREATE TABLE IF NOT EXISTS assignment_rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  objective_name VARCHAR(255) NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor Sessions table
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'in_progress' -- 'in_progress', 'completed', 'abandoned'
);

-- Tutor Turns table (conversation history)
CREATE TABLE IF NOT EXISTS tutor_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  turn_index INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'ai' or 'student'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn Grades table (grading for each turn)
CREATE TABLE IF NOT EXISTS turn_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turn_id UUID NOT NULL REFERENCES tutor_turns(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES assignment_rubrics(id) ON DELETE CASCADE,
  score_0_4 INTEGER CHECK (score_0_4 >= 0 AND score_0_4 <= 4),
  rationale TEXT,
  missing_points TEXT,
  next_difficulty VARCHAR(50), -- 'easy', 'medium', 'hard'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mastery Snapshots table (overall progress tracking)
CREATE TABLE IF NOT EXISTS mastery_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES assignment_rubrics(id) ON DELETE CASCADE,
  mastery_score_0_4 DECIMAL(3,2) CHECK (mastery_score_0_4 >= 0 AND mastery_score_0_4 <= 4),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, rubric_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_invite_code ON classes(invite_code);

CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);

CREATE INDEX idx_books_created_by ON books(created_by);

CREATE INDEX idx_chapters_book ON chapters(book_id);

CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_book ON assignments(book_id);

CREATE INDEX idx_assignment_students_assignment ON assignment_students(assignment_id);
CREATE INDEX idx_assignment_students_student ON assignment_students(student_id);

CREATE INDEX idx_assignment_rubrics_assignment ON assignment_rubrics(assignment_id);

CREATE INDEX idx_tutor_sessions_student ON tutor_sessions(student_id);
CREATE INDEX idx_tutor_sessions_assignment ON tutor_sessions(assignment_id);

CREATE INDEX idx_tutor_turns_session ON tutor_turns(session_id);

CREATE INDEX idx_turn_grades_turn ON turn_grades(turn_id);
CREATE INDEX idx_turn_grades_rubric ON turn_grades(rubric_id);

CREATE INDEX idx_mastery_snapshots_session ON mastery_snapshots(session_id);
CREATE INDEX idx_mastery_snapshots_rubric ON mastery_snapshots(rubric_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CLASSES POLICIES
-- =====================================================

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes"
  ON classes FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can create classes
CREATE POLICY "Teachers can create classes"
  ON classes FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own classes
CREATE POLICY "Teachers can update own classes"
  ON classes FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete own classes"
  ON classes FOR DELETE
  USING (auth.uid() = teacher_id);

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view students in their classes"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = students.id
      AND c.teacher_id = auth.uid()
    )
  );

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (id = auth.uid()::uuid);

-- Teachers can create students (when they join via invite code)
CREATE POLICY "Teachers can create students"
  ON students FOR INSERT
  WITH CHECK (true); -- Will be refined based on auth flow

-- =====================================================
-- CLASS_STUDENTS POLICIES
-- =====================================================

-- Teachers can view class-student relationships for their classes
CREATE POLICY "Teachers can view their class rosters"
  ON class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can add students to their classes
CREATE POLICY "Teachers can add students to classes"
  ON class_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can remove students from their classes
CREATE POLICY "Teachers can remove students from classes"
  ON class_students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- BOOKS POLICIES
-- =====================================================

-- Teachers can view their own books
CREATE POLICY "Teachers can view own books"
  ON books FOR SELECT
  USING (auth.uid() = created_by);

-- Teachers can create books
CREATE POLICY "Teachers can create books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Teachers can update their own books
CREATE POLICY "Teachers can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = created_by);

-- Teachers can delete their own books
CREATE POLICY "Teachers can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- CHAPTERS POLICIES
-- =====================================================

-- Teachers can view chapters of their books
CREATE POLICY "Teachers can view chapters of own books"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.created_by = auth.uid()
    )
  );

-- Teachers can create chapters for their books
CREATE POLICY "Teachers can create chapters"
  ON chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.created_by = auth.uid()
    )
  );

-- Teachers can update chapters of their books
CREATE POLICY "Teachers can update chapters"
  ON chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.created_by = auth.uid()
    )
  );

-- Teachers can delete chapters of their books
CREATE POLICY "Teachers can delete chapters"
  ON chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
      AND books.created_by = auth.uid()
    )
  );

-- =====================================================
-- ASSIGNMENTS POLICIES
-- =====================================================

-- Teachers can view assignments for their classes
CREATE POLICY "Teachers can view class assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can create assignments for their classes
CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can update assignments for their classes
CREATE POLICY "Teachers can update assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can delete assignments for their classes
CREATE POLICY "Teachers can delete assignments"
  ON assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- ASSIGNMENT_STUDENTS POLICIES
-- =====================================================

-- Teachers can view which students are assigned to their assignments
CREATE POLICY "Teachers can view assignment students"
  ON assignment_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_students.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can assign students to assignments
CREATE POLICY "Teachers can assign students"
  ON assignment_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_students.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- ASSIGNMENT_RUBRICS POLICIES
-- =====================================================

-- Teachers can view rubrics for their assignments
CREATE POLICY "Teachers can view assignment rubrics"
  ON assignment_rubrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_rubrics.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can create rubrics for their assignments
CREATE POLICY "Teachers can create rubrics"
  ON assignment_rubrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_rubrics.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update rubrics for their assignments
CREATE POLICY "Teachers can update rubrics"
  ON assignment_rubrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_rubrics.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can delete rubrics for their assignments
CREATE POLICY "Teachers can delete rubrics"
  ON assignment_rubrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = assignment_rubrics.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- TUTOR SESSIONS POLICIES (Basic - will expand for students)
-- =====================================================

-- Teachers can view sessions for their class assignments
CREATE POLICY "Teachers can view tutor sessions"
  ON tutor_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON c.id = a.class_id
      WHERE a.id = tutor_sessions.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Note: Replace 'your-user-id' with your actual Supabase user ID
-- You can find this in Supabase Dashboard > Authentication > Users

-- Example seed data (commented out - uncomment and update IDs to use)
/*
INSERT INTO classes (teacher_id, name, description, invite_code) VALUES
  ('your-user-id', 'Period 3 - American Literature', 'Classic American novels and short stories', 'AB23-CD45'),
  ('your-user-id', 'Period 5 - World Literature', 'Exploring global perspectives through literature', 'EF67-GH89');

INSERT INTO students (name, email) VALUES
  ('Emma Johnson', 'emma.j@school.edu'),
  ('Liam Smith', 'liam.s@school.edu'),
  ('Olivia Brown', 'olivia.b@school.edu');
*/
