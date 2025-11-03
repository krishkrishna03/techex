import React from 'react';
import { Clock, Calendar, FileText, Users, Eye, Send, CreditCard as Edit2, Trash2, BarChart3 } from 'lucide-react';

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  topics?: string[];
  difficulty?: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

interface TestCardProps {
  test: Test;
  onView: (testId: string) => void;
  onAssign: (testId: string) => void;
  onEdit?: (testId: string) => void;
  onDelete?: (testId: string) => void;
  onReport?: (testId: string) => void;
  showActions?: boolean;
}

const TestCard: React.FC<TestCardProps> = ({ test, onView, onAssign, onEdit, onDelete, onReport, showActions = true }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Verbal': 'bg-blue-100 text-blue-800',
      'Reasoning': 'bg-green-100 text-green-800',
      'Technical': 'bg-purple-100 text-purple-800',
      'Arithmetic': 'bg-orange-100 text-orange-800',
      'Communication': 'bg-pink-100 text-pink-800'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

 const getTestTypeColor = (testType: string) => {
  const colors = {
    'Assessment': 'bg-blue-100 text-blue-800',
    'Practice': 'bg-green-100 text-green-800',
    'Assignment': 'bg-purple-100 text-purple-800',
    'Mock Test': 'bg-orange-100 text-orange-800',
    'Specific Company Test': 'bg-red-100 text-red-800',
  };

  return colors[testType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};


  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  const isActive = () => {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date(test.endDateTime);
    return now >= start && now <= end;
  };

  const getStatus = () => {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date(test.endDateTime);
    
    if (now < start) return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    if (now > end) return { text: 'Ended', color: 'bg-red-100 text-red-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const status = getStatus();

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-300 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white truncate flex-1">{test.testName}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color} shadow-md ml-2`}>
          {status.text}
        </span>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed mb-3">{test.testDescription}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getSubjectColor(test.subject)} shadow-sm border border-opacity-20 border-gray-900`}>
              {test.subject}
            </span>
            {test.testType && (
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getTestTypeColor(test.testType)} shadow-sm border border-opacity-20 border-gray-900`}>
                {test.testType}
              </span>
            )}
            {test.difficulty && (
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getDifficultyColor(test.difficulty)} shadow-sm border border-opacity-20 border-gray-900`}>
                {test.difficulty}
              </span>
            )}
          </div>

          {test.topics && test.topics.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Topics Covered:</p>
              <div className="flex flex-wrap gap-1.5">
                {test.topics.map((topic, index) => (
                  <span key={index} className="px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs rounded-md border border-gray-200 font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
            <FileText className="w-5 h-5 mx-auto mb-1.5 text-white group-hover:scale-110 transition-transform" />
            <p className="text-xs text-blue-100 font-medium">Questions</p>
            <p className="text-lg font-bold text-white">{test.numberOfQuestions}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
            <Users className="w-5 h-5 mx-auto mb-1.5 text-white group-hover:scale-110 transition-transform" />
            <p className="text-xs text-green-100 font-medium">Total Marks</p>
            <p className="text-lg font-bold text-white">{test.totalMarks}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
            <Clock className="w-5 h-5 mx-auto mb-1.5 text-white group-hover:scale-110 transition-transform" />
            <p className="text-xs text-orange-100 font-medium">Duration</p>
            <p className="text-lg font-bold text-white">{test.duration} min</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow group">
            <Calendar className="w-5 h-5 mx-auto mb-1.5 text-white group-hover:scale-110 transition-transform" />
            <p className="text-xs text-gray-200 font-medium">Created</p>
            <p className="text-xs font-bold text-white">{formatDate(test.createdAt)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500 font-medium mb-0.5">Start Date:</p>
              <p className="text-gray-800 font-semibold">{formatDate(test.startDateTime)}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-0.5">End Date:</p>
              <p className="text-gray-800 font-semibold">{formatDate(test.endDateTime)}</p>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onView(test._id)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                title="View Test Details"
              >
                <Eye size={16} />
                Preview
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(test._id)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 px-3 rounded-lg hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                  title="Edit Test"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}
              <button
                onClick={() => onAssign(test._id)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 px-3 rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                title="Assign Test to Students"
              >
                <Send size={16} />
                Assign
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(test._id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 px-3 rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                  title="Delete Test"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            {onReport && (
              <button
                onClick={() => onReport(test._id)}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 px-3 rounded-lg hover:from-indigo-600 hover:to-indigo-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                title="View Analytics & Reports"
              >
                <BarChart3 size={16} />
                Analytics & Reports
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCard;