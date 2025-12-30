import { useState, useEffect } from 'react';
import { useClassStore } from '../stores/classStore';
import CreateClassModal from '../components/classes/CreateClassModal';
import ClassCard from '../components/classes/ClassCard';

export default function Classes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { classes, isLoading, fetchClasses } = useClassStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🎓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No classes yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first class to start managing students and assignments
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classData) => (
            <ClassCard key={classData.id} classData={classData} />
          ))}
        </div>
      )}

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
