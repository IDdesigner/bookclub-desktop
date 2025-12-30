# Teacher Desktop App (Web) — MVP Spec

This is the teacher-facing authoring and analytics app.
Desktop-first web experience.

## Goals
- Create/manage books, chapters, and "tutoring sessions"
- Upload/ingest public-domain book text (e.g., Project Gutenberg)
- Define learning objectives + rubrics per chapter
- View student progress, mastery, and common misconceptions

## Tech Stack
- Frontend: React + Vite + TypeScript
- Styling/UI: Tailwind (or MUI), React Hook Form
- Auth/DB/Storage: Supabase (Auth, Postgres, Storage, RLS)
- Server logic: Supabase Edge Functions (LLM calls + ingestion pipelines)
- Optional: TanStack Query, Zustand, TipTap (if you need rich editing)

## User Roles
- Admin (optional): manage org-wide settings
- Teacher: creates content, runs classes, views analytics
- Student: does not use this app

## Core Entities (Conceptual)
- Book
- Chapter
- ChapterObjectives (learning objectives)
- Rubric (criteria for grading / mastery)
- Class / Roster
- TutorSession (a student's run through a chapter)
- TutorTurn (each AI ↔ student exchange)
- MasterySnapshot (objective mastery scores)

## Screens (MVP)
1. Login / Org selection
2. Books
   - Create Book
   - Import text (paste / upload / URL)
3. Chapters (per book)
   - Chapter list (title, length, status: ingested/not)
   - Chapter editor:
     - objectives (3–7 per chapter)
     - question style settings (Socratic, quiz-heavy, etc.)
     - rubric (0–4 mastery per objective)
4. Classes & Rosters
   - Create class
   - Invite/link students
   - Assign chapters
5. Analytics Dashboard
   - Per class: mastery distribution by objective
   - Per student: progress over time
   - "Common misses" (frequent misconceptions)

## Ingestion Workflow (Teacher)
### Input options
- Paste chapter text
- Upload plain text file
- Import from URL (public domain)

### Pipeline (recommended)
1. Store raw text (Postgres table `chapter_source` or Storage)
2. Chunk text (e.g., 300–800 tokens per chunk)
3. Create embeddings per chunk
4. Store in `chapter_chunks` with vector + metadata

## AI Tutor Settings (per chapter)
- Tone: supportive / strict / playful
- Difficulty ramp: easy → medium → hard
- Mastery threshold: e.g., objective score >= 3 twice
- "Evidence required" toggle:
  - If ON, student must reference a phrase/section (not long quotes)
- Allowed help:
  - hints
  - multiple choice rescue
  - "try again" with guidance

## Data Model (Draft Tables)
You can adjust names, but keep the relationships.

- books (id, title, author, source, public_domain_bool, created_by)
- chapters (id, book_id, number, title, source_text_ref, status)
- objectives (id, chapter_id, objective_text, order_index)
- rubrics (id, chapter_id, json_criteria)  // structured rubric per objective
- chapter_chunks (id, chapter_id, chunk_index, content, embedding, token_count)
- classes (id, teacher_id, name)
- class_students (class_id, student_id)
- assignments (id, class_id, chapter_id, due_at)
- tutor_sessions (id, student_id, chapter_id, started_at, completed_at, status)
- tutor_turns (id, session_id, turn_index, role, content, created_at)
- turn_grades (id, turn_id, objective_id, score_0_4, rationale, missing_points, next_difficulty)
- mastery_snapshots (id, session_id, objective_id, mastery_score_0_4, updated_at)

## Security / RLS Notes
- Teachers can only see:
  - their classes
  - their students
  - sessions tied to their classes
- Students can only see:
  - their own sessions + turns + feedback
- Lock down chunk table access (students should not read raw chunks directly)

## Edge Functions (Suggested)
- ingestChapterText(chapter_id): chunk + embed + store vectors
- startTutorSession(chapter_id): create session + generate intro message
- tutorNextTurn(session_id, student_message): retrieve + generate next tutor message + grade
- getTeacherAnalytics(class_id): aggregate mastery + misconceptions

## Definition of Done (MVP)
- Teacher can create a book + chapter and ingest text
- Teacher can define objectives + rubric
- Students can complete a chapter tutor session
- Teacher can see mastery outcomes per student and per objective
