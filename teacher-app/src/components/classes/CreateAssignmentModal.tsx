import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import { useAssignmentStore } from '../../stores/assignmentStore';

interface CreateAssignmentFormData {
  title: string;
  description: string;
  contentSource: 'existing-book' | 'paste-text';
  bookId: string;
  pastedText: string;
  pageRange: { start: number; end: number } | null;
  aiVoice: 'supportive' | 'strict' | 'playful';
  aiTone: 'easy' | 'medium' | 'hard';
  evidenceRequired: boolean;
  selectedStudents: string[];
  dueDate: string;
}

interface Rubric {
  id: string;
  rubricTitle: string;
  weight: number;
  whatThisTests: string;
  aiLookingFor: string;
  strongMastery: string;
  adequate: string;
  emerging: string;
  minimal: string;
  noEvidence: string;
  exampleAiFollowupIfWeak: string;
}

interface Assignment {
  id: string;
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
  rubrics?: any[];
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  students: Array<{ id: string; name: string }>;
  assignment?: Assignment | null;
}

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  classId,
  students,
  assignment,
}: CreateAssignmentModalProps) {
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<CreateAssignmentFormData>({
    defaultValues: {
      contentSource: 'existing-book',
      aiVoice: 'supportive',
      aiTone: 'medium',
      evidenceRequired: true,
      selectedStudents: students.map(s => s.id),
    }
  });

  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const updateAssignment = useAssignmentStore((state) => state.updateAssignment);

  const selectedStudents = watch('selectedStudents') || [];
  const contentSource = watch('contentSource');

  // Load assignment data when editing
  useEffect(() => {
    if (assignment && isOpen) {
      // Set form values
      setValue('title', assignment.title);
      setValue('description', assignment.description || '');
      setValue('contentSource', assignment.content_type === 'book' ? 'existing-book' : 'paste-text');
      setValue('bookId', assignment.book_id || '');
      setValue('pastedText', assignment.pasted_text || '');
      if (assignment.page_range_start || assignment.page_range_end) {
        setValue('pageRange', {
          start: assignment.page_range_start || 0,
          end: assignment.page_range_end || 0,
        });
      }
      setValue('aiVoice', assignment.ai_voice);
      setValue('aiTone', assignment.ai_tone);
      setValue('evidenceRequired', assignment.evidence_required);
      setValue('dueDate', assignment.due_date ? assignment.due_date.split('T')[0] : '');

      // Load rubrics
      if (assignment.rubrics && assignment.rubrics.length > 0) {
        const loadedRubrics = assignment.rubrics.map((r: any) => ({
          id: r.id || crypto.randomUUID(),
          rubricTitle: r.rubric_title || '',
          weight: r.weight || 0,
          whatThisTests: r.what_this_tests || '',
          aiLookingFor: r.ai_looking_for || '',
          strongMastery: r.strong_mastery || '',
          adequate: r.adequate || '',
          emerging: r.emerging || '',
          minimal: r.minimal || '',
          noEvidence: r.no_evidence || '',
          exampleAiFollowupIfWeak: r.example_ai_followup_if_weak || '',
        }));
        setRubrics(loadedRubrics);
      }
    } else if (!assignment && isOpen) {
      // Reset to defaults when creating new
      reset();
      setRubrics([]);
    }
  }, [assignment, isOpen, setValue, reset]);

  const handleSave = async (data: CreateAssignmentFormData, status: 'draft' | 'published') => {
    setIsSaving(true);
    try {
      const assignmentData = {
        class_id: classId,
        title: data.title,
        description: data.description || undefined,
        content_type: data.contentSource === 'existing-book' ? 'book' as const : 'pasted_text' as const,
        book_id: data.contentSource === 'existing-book' ? (data.bookId || undefined) : undefined,
        pasted_text: data.contentSource === 'paste-text' ? data.pastedText : undefined,
        page_range_start: data.pageRange?.start ? Number(data.pageRange.start) : undefined,
        page_range_end: data.pageRange?.end ? Number(data.pageRange.end) : undefined,
        ai_voice: data.aiVoice,
        ai_tone: data.aiTone,
        evidence_required: data.evidenceRequired,
        due_date: data.dueDate || undefined,
      };

      const rubricsData = rubrics.map((rubric, index) => ({
        rubric_title: rubric.rubricTitle,
        weight: rubric.weight,
        what_this_tests: rubric.whatThisTests || undefined,
        ai_looking_for: rubric.aiLookingFor || undefined,
        strong_mastery: rubric.strongMastery || undefined,
        adequate: rubric.adequate || undefined,
        emerging: rubric.emerging || undefined,
        minimal: rubric.minimal || undefined,
        no_evidence: rubric.noEvidence || undefined,
        example_ai_followup_if_weak: rubric.exampleAiFollowupIfWeak || undefined,
        order_index: index,
      }));

      if (assignment) {
        // Update existing assignment
        await updateAssignment(assignment.id, { ...assignmentData, status }, rubricsData, data.selectedStudents);
      } else {
        // Create new assignment
        await createAssignment(assignmentData, rubricsData, data.selectedStudents, status);
      }

      reset();
      setRubrics([]);
      onClose();
    } catch (error: any) {
      console.error('Failed to save assignment:', error);
      alert(`Failed to save assignment: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitDraft = (data: CreateAssignmentFormData) => {
    handleSave(data, 'draft');
  };

  const onSubmitPublished = (data: CreateAssignmentFormData) => {
    handleSave(data, 'published');
  };

  const handleClose = () => {
    reset();
    setRubrics([]);
    onClose();
  };

  const updateRubricWeight = (id: string, weight: number) => {
    setRubrics(rubrics.map(r => r.id === id ? { ...r, weight } : r));
  };

  const updateRubricField = (id: string, field: keyof Rubric, value: string | number) => {
    setRubrics(rubrics.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRubric = () => {
    const newRubric: Rubric = {
      id: crypto.randomUUID(),
      rubricTitle: '',
      weight: 0,
      whatThisTests: '',
      aiLookingFor: '',
      strongMastery: '',
      adequate: '',
      emerging: '',
      minimal: '',
      noEvidence: '',
      exampleAiFollowupIfWeak: '',
    };
    setRubrics([...rubrics, newRubric]);
  };

  const removeRubric = (id: string) => {
    setRubrics(rubrics.filter(r => r.id !== id));
  };

  const totalWeight = rubrics.reduce((sum, r) => sum + r.weight, 0);

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setValue('selectedStudents', []);
    } else {
      setValue('selectedStudents', students.map(s => s.id));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={assignment ? "Edit Assignment" : "Create Assignment"}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., To Kill a Mockingbird - Chapters 1-5"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the assignment..."
          />
        </div>

        {/* Content Source Selection */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Content Selection</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Source *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('contentSource')}
                  value="existing-book"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Use an existing book from library</span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('contentSource')}
                  value="paste-text"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Paste text directly (e.g., a chapter)</span>
              </label>
            </div>
          </div>

          {contentSource === 'existing-book' ? (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book *
                </label>
                <select
                  {...register('bookId', {
                    required: contentSource === 'existing-book' ? 'Book is required' : false
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a book...</option>
                  <option value="book1">To Kill a Mockingbird</option>
                  <option value="book2">1984</option>
                  <option value="book3">The Great Gatsby</option>
                </select>
                {errors.bookId && (
                  <p className="mt-1 text-sm text-red-600">{errors.bookId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Page
                  </label>
                  <input
                    type="number"
                    {...register('pageRange.start')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Page
                  </label>
                  <input
                    type="number"
                    {...register('pageRange.end')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste Chapter Text *
              </label>
              <textarea
                {...register('pastedText', {
                  required: contentSource === 'paste-text' ? 'Text is required' : false
                })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Paste the chapter text here..."
              />
              {errors.pastedText && (
                <p className="mt-1 text-sm text-red-600">{errors.pastedText.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This text will be used to generate questions and evaluate student responses
              </p>
            </div>
          )}
        </div>

        {/* AI Tutor Settings */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">AI Tutor Settings</h3>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voice/Personality
            </label>
            <select
              {...register('aiVoice')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="supportive">Supportive (encouraging and patient)</option>
              <option value="strict">Strict (formal and demanding)</option>
              <option value="playful">Playful (fun and engaging)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              {...register('aiTone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy (basic comprehension)</option>
              <option value="medium">Medium (analysis and inference)</option>
              <option value="hard">Hard (critical thinking and synthesis)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('evidenceRequired')}
              id="evidenceRequired"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="evidenceRequired" className="ml-2 text-sm text-gray-700">
              Require textual evidence in answers
            </label>
          </div>
        </div>

        {/* Rubrics */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">Grading Rubrics</h3>
            <button
              type="button"
              onClick={addRubric}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Rubric
            </button>
          </div>

          {rubrics.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">No rubrics yet</p>
              <button
                type="button"
                onClick={addRubric}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Add your first rubric
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-3">
                {rubrics.map((rubric) => (
                  <div key={rubric.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Rubric {rubrics.indexOf(rubric) + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeRubric(rubric.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Rubric Title & Weight */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rubric Title *
                          </label>
                          <input
                            type="text"
                            value={rubric.rubricTitle}
                            onChange={(e) => updateRubricField(rubric.id, 'rubricTitle', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                            placeholder="e.g., Character Analysis"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Weight *
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={rubric.weight}
                              onChange={(e) => updateRubricWeight(rubric.id, parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                              min="0"
                              max="100"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>
                      </div>

                      {/* What This Tests */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          What This Tests
                        </label>
                        <textarea
                          value={rubric.whatThisTests}
                          onChange={(e) => updateRubricField(rubric.id, 'whatThisTests', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                          rows={2}
                          placeholder="Describe the learning objective being assessed..."
                        />
                      </div>

                      {/* AI Looking For */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          AI Looking For
                        </label>
                        <textarea
                          value={rubric.aiLookingFor}
                          onChange={(e) => updateRubricField(rubric.id, 'aiLookingFor', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                          rows={2}
                          placeholder="What the AI tutor should look for when evaluating..."
                        />
                      </div>

                      {/* Score Guide */}
                      <div className="border-t pt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Score Guide</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-green-700 mb-1">
                              Strong Mastery
                            </label>
                            <input
                              type="text"
                              value={rubric.strongMastery}
                              onChange={(e) => updateRubricField(rubric.id, 'strongMastery', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                              placeholder="Criteria for strong mastery..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                              Adequate
                            </label>
                            <input
                              type="text"
                              value={rubric.adequate}
                              onChange={(e) => updateRubricField(rubric.id, 'adequate', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                              placeholder="Criteria for adequate performance..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-yellow-700 mb-1">
                              Emerging
                            </label>
                            <input
                              type="text"
                              value={rubric.emerging}
                              onChange={(e) => updateRubricField(rubric.id, 'emerging', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                              placeholder="Criteria for emerging understanding..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-orange-700 mb-1">
                              Minimal
                            </label>
                            <input
                              type="text"
                              value={rubric.minimal}
                              onChange={(e) => updateRubricField(rubric.id, 'minimal', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                              placeholder="Criteria for minimal understanding..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-700 mb-1">
                              No Evidence
                            </label>
                            <input
                              type="text"
                              value={rubric.noEvidence}
                              onChange={(e) => updateRubricField(rubric.id, 'noEvidence', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                              placeholder="Criteria for no evidence..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Example AI Follow-up */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Example AI Follow-up if Weak
                        </label>
                        <textarea
                          value={rubric.exampleAiFollowupIfWeak}
                          onChange={(e) => updateRubricField(rubric.id, 'exampleAiFollowupIfWeak', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                          rows={2}
                          placeholder="Example question or prompt to help struggling students..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`text-sm font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Total Weight: {totalWeight}% {totalWeight !== 100 && '(must equal 100%)'}
              </div>
            </>
          )}
        </div>

        {/* Student Selection */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">Assign to Students</h3>
            <button
              type="button"
              onClick={toggleAllStudents}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
            {students.map((student) => (
              <label key={student.id} className="flex items-center hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  value={student.id}
                  {...register('selectedStudents')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{student.name}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedStudents.length} of {students.length} students selected
          </p>
        </div>

        {/* Due Date */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date (optional)
          </label>
          <input
            type="date"
            {...register('dueDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleSubmit(onSubmitDraft)}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : assignment ? 'Save Changes' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmitPublished)}
              disabled={isSaving || (rubrics.length > 0 && totalWeight !== 100)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (assignment ? 'Saving...' : 'Publishing...') : assignment ? 'Save & Publish' : 'Publish Assignment'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
