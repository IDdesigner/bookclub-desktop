import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassStore } from '../stores/classStore';
import StudentRoster from '../components/classes/StudentRoster';
import AssignmentsList from '../components/classes/AssignmentsList';
import Tabs from '../components/common/Tabs';

export default function ClassDetails() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { selectClass, selectedClass } = useClassStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');

  useEffect(() => {
    if (classId) {
      selectClass(classId);
    }
  }, [classId, selectClass]);

  const handleCopyCode = () => {
    if (selectedClass?.invite_code) {
      navigator.clipboard.writeText(selectedClass.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedClass) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Class not found.</p>
        <button
          onClick={() => navigate('/classes')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Classes
        </button>
      </div>
    );
  }

  const tabs = [
    {
      id: 'roster',
      label: 'Student Roster',
      content: <StudentRoster classId={selectedClass.id} />,
    },
    {
      id: 'assignments',
      label: 'Assignments',
      content: <AssignmentsList classId={selectedClass.id} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/classes')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Classes
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{selectedClass.name}</h1>
        {selectedClass.description && (
          <p className="text-gray-600 mt-2">{selectedClass.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Invite Code</h2>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Students can join with this code:</p>
              <p className="text-4xl font-bold text-blue-600 tracking-wider mb-4">
                {selectedClass.invite_code}
              </p>
              <button
                onClick={handleCopyCode}
                className={`w-full px-4 py-2 rounded-md transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">How students join:</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex">
                  <span className="font-medium mr-2">1.</span>
                  <span>Share the invite code with your students</span>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">2.</span>
                  <span>Students enter the code in their app</span>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2">3.</span>
                  <span>They'll automatically join your class</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Class Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(selectedClass.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Students:</span>
                <span>{selectedClass.studentCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
