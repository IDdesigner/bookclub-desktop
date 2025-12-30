import { useClassStore } from '../../stores/classStore';

interface StudentRosterProps {
  classId: string;
}

export default function StudentRoster({ classId }: StudentRosterProps) {
  const { selectedClass } = useClassStore();
  const students = selectedClass?.students || [];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Student Roster ({students.length})
        </h2>
      </div>

      {students.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">👥</div>
          <p className="text-gray-600 mb-2">No students have joined yet</p>
          <p className="text-sm text-gray-500">
            Share your class invite code with students to get started
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{student.name}</h3>
                  {student.email && (
                    <p className="text-sm text-gray-500">{student.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Progress
                  </button>
                  <button className="text-gray-400 hover:text-red-600 text-sm">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
