import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateClassCode } from '../utils/generateClassCode';

// Inline type definitions
type Student = {
  id: string;
  email?: string;
  name: string;
  created_at: string;
};

type ClassRoom = {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
};

interface ClassWithStudents extends ClassRoom {
  students?: Student[];
  studentCount?: number;
}

interface ClassStore {
  classes: ClassWithStudents[];
  selectedClass: ClassWithStudents | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchClasses: () => Promise<void>;
  fetchClassWithStudents: (classId: string) => Promise<void>;
  addClass: (classData: { name: string; description?: string }) => Promise<void>;
  updateClass: (id: string, classData: Partial<ClassRoom>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  selectClass: (id: string) => void;
  setError: (error: string | null) => void;
}

export const useClassStore = create<ClassStore>((set, get) => ({
  classes: [],
  selectedClass: null,
  isLoading: false,
  error: null,

  fetchClasses: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch classes for the current user
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (classError) throw classError;

      // For each class, get student count
      const classesWithCounts = await Promise.all(
        (classes || []).map(async (cls) => {
          const { count } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            ...cls,
            studentCount: count || 0,
          };
        })
      );

      set({ classes: classesWithCounts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching classes:', error);
    }
  },

  fetchClassWithStudents: async (classId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) throw classError;

      // Fetch students in this class
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          students (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('class_id', classId);

      if (studentsError) {
        console.error('Students error:', studentsError);
        throw studentsError;
      }

      const students = classStudents?.map((cs: any) => cs.students).filter(Boolean) || [];

      const classWithStudents = {
        ...classData,
        students,
        studentCount: students.length,
      };

      set({ selectedClass: classWithStudents, isLoading: false });

      // Also update in the classes array
      set((state) => ({
        classes: state.classes.map((c) =>
          c.id === classId ? classWithStudents : c
        ),
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching class with students:', error);
    }
  },

  addClass: async (classData: { name: string; description?: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inviteCode = generateClassCode();

      const { data, error } = await supabase
        .from('classes')
        .insert([
          {
            teacher_id: user.id,
            name: classData.name,
            description: classData.description,
            invite_code: inviteCode,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      set((state) => ({
        classes: [{ ...data, studentCount: 0 }, ...state.classes],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error adding class:', error);
    }
  },

  updateClass: async (id: string, classData: Partial<ClassRoom>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
        selectedClass:
          state.selectedClass?.id === id
            ? { ...state.selectedClass, ...data }
            : state.selectedClass,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error updating class:', error);
    }
  },

  deleteClass: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);

      if (error) throw error;

      // Remove from local state
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        selectedClass: state.selectedClass?.id === id ? null : state.selectedClass,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error deleting class:', error);
    }
  },

  selectClass: (id: string) => {
    const classData = get().classes.find((c) => c.id === id);
    set({ selectedClass: classData || null });

    // Fetch fresh data with students
    get().fetchClassWithStudents(id);
  },

  setError: (error: string | null) => set({ error }),
}));
