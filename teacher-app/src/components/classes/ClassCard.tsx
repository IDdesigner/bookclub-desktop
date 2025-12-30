import { useNavigate } from 'react-router-dom';

type ClassRoom = {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
};

interface ClassCardProps {
  classData: ClassRoom & { studentCount?: number };
}

export default function ClassCard({ classData }: ClassCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/classes/${classData.id}`)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{classData.name}</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
          {classData.invite_code}
        </span>
      </div>

      {classData.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{classData.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <span className="mr-1">👥</span>
          <span>{classData.studentCount || 0} students</span>
        </div>
        <div>
          Created {new Date(classData.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
