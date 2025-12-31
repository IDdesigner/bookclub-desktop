import { useState, useEffect } from 'react';
import { useClassStore } from '../../stores/classStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import CreateAssignmentModal from './CreateAssignmentModal';

interface AssignmentsListProps {
  classId: string;
}

export default function AssignmentsList({ classId }: AssignmentsListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const { selectedClass } = useClassStore();
  const { assignments, fetchAssignments, publishAssignment, unpublishAssignment, isLoading } = useAssignmentStore();
  const students = selectedClass?.students || [];

  useEffect(() => {
    fetchAssignments(classId);
  }, [classId, fetchAssignments]);

  const handlePublish = async (assignmentId: string) => {
    if (confirm('Are you sure you want to publish this assignment? Students will be able to see it.')) {
      try {
        await publishAssignment(assignmentId);
      } catch (error) {
        console.error('Failed to publish assignment:', error);
      }
    }
  };

  const handleUnpublish = async (assignmentId: string) => {
    if (confirm('Are you sure you want to unpublish this assignment? Students will no longer be able to see it.')) {
      try {
        await unpublishAssignment(assignmentId);
      } catch (error) {
        console.error('Failed to unpublish assignment:', error);
      }
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingAssignment(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Assignments ({assignments.length})
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Assignment
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <p className="text-gray-600 mb-2">No assignments yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Create your first assignment to get started
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Assignment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      {assignment.status === 'draft' ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {assignment.content_type === 'book' && assignment.book_id && (
                        <span>📖 Book Assignment</span>
                      )}
                      {assignment.content_type === 'pasted_text' && (
                        <span>📄 Text Assignment</span>
                      )}
                      <span>👥 {assignment.student_count || 0} students</span>
                      {assignment.rubrics && assignment.rubrics.length > 0 && (
                        <span>📋 {assignment.rubrics.length} rubrics</span>
                      )}
                      {assignment.due_date && (
                        <span>📅 Due {new Date(assignment.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(assignment.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(assignment.id)}
                        className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        classId={classId}
        students={students.map(s => ({ id: s.id, name: s.name }))}
        assignment={editingAssignment}
      />
    </>
  );
}
