export interface Book {
  id: string;
  title: string;
  author: string;
  source?: string;
  public_domain_bool: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  number: number;
  title: string;
  source_text_ref?: string;
  status: 'draft' | 'ingested' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  chapter_id: string;
  objective_text: string;
  order_index: number;
  created_at: string;
}

export interface Rubric {
  id: string;
  chapter_id: string;
  json_criteria: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ClassRoom = {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export type Student = {
  id: string;
  email?: string;
  name: string;
  created_at: string;
}

export interface ClassStudent {
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  chapter_id: string;
  due_at?: string;
  created_at: string;
}

export interface TutorSession {
  id: string;
  student_id: string;
  chapter_id: string;
  started_at: string;
  completed_at?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface TutorTurn {
  id: string;
  session_id: string;
  turn_index: number;
  role: 'ai' | 'student';
  content: string;
  created_at: string;
}

export interface TurnGrade {
  id: string;
  turn_id: string;
  objective_id: string;
  score_0_4: number;
  rationale?: string;
  missing_points?: string;
  next_difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MasterySnapshot {
  id: string;
  session_id: string;
  objective_id: string;
  mastery_score_0_4: number;
  updated_at: string;
}
