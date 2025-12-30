import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type Assignment = {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  content_type: 'book' | 'pasted_text';
  book_id?: string;
  pasted_text?: string;
  page_range_start?: number;
  page_range_end?: number;
  ai_voice: 'supportive' | 'strict' | 'playful';
  ai_tone: 'easy' | 'medium' | 'hard';
  evidence_required: boolean;
  due_date?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
};

type Rubric = {
  id?: string;
  assignment_id?: string;
  rubric_title: string;
  weight: number;
  what_this_tests?: string;
  ai_looking_for?: string;
  strong_mastery?: string;
  adequate?: string;
  emerging?: string;
  minimal?: string;
  no_evidence?: string;
  example_ai_followup_if_weak?: string;
  order_index: number;
};

type AssignmentWithRubrics = Assignment & {
  rubrics: Rubric[];
  student_count?: number;
};

interface AssignmentStore {
  assignments: AssignmentWithRubrics[];
  isLoading: boolean;
  error: string | null;
  fetchAssignments: (classId: string) => Promise<void>;
  createAssignment: (assignmentData: Partial<Assignment>, rubrics: Omit<Rubric, 'id' | 'assignment_id'>[], studentIds: string[], status: 'draft' | 'published') => Promise<string>;
  updateAssignment: (assignmentId: string, assignmentData: Partial<Assignment>, rubrics: Omit<Rubric, 'assignment_id'>[], studentIds: string[]) => Promise<void>;
  publishAssignment: (assignmentId: string) => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,

  fetchAssignments: async (classId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch assignments with rubrics
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_rubrics (*)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get student counts for each assignment
      const assignmentsWithCounts = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { count } = await supabase
            .from('assignment_students')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);

          return {
            ...assignment,
            rubrics: assignment.assignment_rubrics || [],
            student_count: count || 0,
          };
        })
      );

      set({ assignments: assignmentsWithCounts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createAssignment: async (assignmentData, rubrics, studentIds, status) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert([{
          ...assignmentData,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create rubrics
      if (rubrics.length > 0) {
        const rubricsToInsert = rubrics.map((rubric, index) => ({
          assignment_id: assignment.id,
          ...rubric,
          order_index: index,
        }));

        const { error: rubricsError } = await supabase
          .from('assignment_rubrics')
          .insert(rubricsToInsert);

        if (rubricsError) throw rubricsError;
      }

      // Assign to students
      if (studentIds.length > 0) {
        const assignmentStudents = studentIds.map(studentId => ({
          assignment_id: assignment.id,
          student_id: studentId,
        }));

        const { error: studentsError } = await supabase
          .from('assignment_students')
          .insert(assignmentStudents);

        if (studentsError) throw studentsError;
      }

      // Refresh assignments list
      if (assignmentData.class_id) {
        await get().fetchAssignments(assignmentData.class_id);
      }

      set({ isLoading: false });
      return assignment.id;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateAssignment: async (assignmentId, assignmentData, rubrics, studentIds) => {
    set({ isLoading: true, error: null });
    try {
      // Update assignment
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          ...assignmentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Delete existing rubrics and recreate
      const { error: deleteRubricsError } = await supabase
        .from('assignment_rubrics')
        .delete()
        .eq('assignment_id', assignmentId);

      if (deleteRubricsError) throw deleteRubricsError;

      if (rubrics.length > 0) {
        const rubricsToInsert = rubrics.map((rubric, index) => ({
          assignment_id: assignmentId,
          ...rubric,
          order_index: index,
        }));

        const { error: insertRubricsError } = await supabase
          .from('assignment_rubrics')
          .insert(rubricsToInsert);

        if (insertRubricsError) throw insertRubricsError;
      }

      // Update student assignments
      const { error: deleteStudentsError } = await supabase
        .from('assignment_students')
        .delete()
        .eq('assignment_id', assignmentId);

      if (deleteStudentsError) throw deleteStudentsError;

      if (studentIds.length > 0) {
        const assignmentStudents = studentIds.map(studentId => ({
          assignment_id: assignmentId,
          student_id: studentId,
        }));

        const { error: insertStudentsError } = await supabase
          .from('assignment_students')
          .insert(assignmentStudents);

        if (insertStudentsError) throw insertStudentsError;
      }

      // Refresh assignments list
      if (assignmentData.class_id) {
        await get().fetchAssignments(assignmentData.class_id);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  publishAssignment: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        assignments: state.assignments.map(a =>
          a.id === assignmentId ? { ...a, status: 'published' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteAssignment: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      set((state) => ({
        assignments: state.assignments.filter(a => a.id !== assignmentId),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
