import React, { useState } from 'react';
import {Activity , Clock, Calendar, FileText, Users, Eye, Send, CreditCard as Edit2, Trash2, BarChart3, Award, TrendingUp, Target, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

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
  assignmentCount?: number;
  completionRate?: number;
  averageScore?: number;
}

interface AdvancedTestCardProps {
  test: Test;
  onView: (testId: string) => void;
  onAssign: (testId: string) => void;
  onEdit?: (testId: string) => void;
  onDelete?: (testId: string) => void;
  onReport?: (testId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const AdvancedTestCard: React.FC<AdvancedTestCardProps> = ({
  test,
  onView,
  onAssign,
  onEdit,
  onDelete,
  onReport,
  showActions = true,
  variant = 'default'
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubjectGradient = (subject: string) => {
    const gradients = {
      'Verbal': 'from-blue-500 via-blue-600 to-blue-700',
      'Reasoning': 'from-green-500 via-green-600 to-green-700',
      'Technical': 'from-teal-500 via-teal-600 to-teal-700',
      'Arithmetic': 'from-orange-500 via-orange-600 to-orange-700',
      'Communication': 'from-pink-500 via-pink-600 to-pink-700'
    };
    return gradients[subject as keyof typeof gradients] || 'from-gray-500 via-gray-600 to-gray-700';
  };

  const getSubjectAccent = (subject: string) => {
    const accents = {
      'Verbal': 'border-blue-300 bg-blue-50',
      'Reasoning': 'border-green-300 bg-green-50',
      'Technical': 'border-teal-300 bg-teal-50',
      'Arithmetic': 'border-orange-300 bg-orange-50',
      'Communication': 'border-pink-300 bg-pink-50'
    };
    return accents[subject as keyof typeof accents] || 'border-gray-300 bg-gray-50';
  };

  const getTestTypeBadge = (testType: string) => {
    const badges = {
      'Assessment': 'bg-blue-100 text-blue-800 border-blue-300',
      'Practice': 'bg-green-100 text-green-800 border-green-300',
      'Assignment': 'bg-amber-100 text-amber-800 border-amber-300',
      'Mock Test': 'bg-orange-100 text-orange-800 border-orange-300',
      'Specific Company Test': 'bg-red-100 text-red-800 border-red-300',
    };
    return badges[testType as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      'Easy': 'bg-green-100 text-green-800 border-green-400',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-400',
      'Hard': 'bg-red-100 text-red-800 border-red-400'
    };
    return badges[difficulty as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatus = () => {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date(test.endDateTime);

    if (now < start) return { text: 'Upcoming', color: 'bg-amber-500', icon: Clock };
    if (now > end) return { text: 'Ended', color: 'bg-gray-500', icon: CheckCircle };
    return { text: 'Active', color: 'bg-green-500', icon: Activity };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-xl shadow-lg border-2 ${getSubjectAccent(test.subject)} hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
        <div className={`bg-gradient-to-r ${getSubjectGradient(test.subject)} px-4 py-3 flex items-center justify-between`}>
          <h3 className="text-base font-bold text-white truncate flex-1">{test.testName}</h3>
          <div className={`${status.color} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
            <StatusIcon size={12} />
            {status.text}
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getTestTypeBadge(test.testType || '')}`}>
              {test.testType}
            </span>
            {test.difficulty && (
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getDifficultyBadge(test.difficulty)}`}>
                {test.difficulty}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="w-4 h-4 mx-auto mb-1 text-gray-600" />
              <p className="text-xs font-bold text-gray-900">{test.numberOfQuestions}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Award className="w-4 h-4 mx-auto mb-1 text-gray-600" />
              <p className="text-xs font-bold text-gray-900">{test.totalMarks}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Clock className="w-4 h-4 mx-auto mb-1 text-gray-600" />
              <p className="text-xs font-bold text-gray-900">{test.duration}m</p>
            </div>
          </div>

          {showActions && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => onView(test._id)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 text-xs font-semibold shadow-md hover:scale-105 transition-all"
              >
                <Eye size={14} />
                View
              </button>
              <button
                onClick={() => onAssign(test._id)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3 rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 text-xs font-semibold shadow-md hover:scale-105 transition-all"
              >
                <Send size={14} />
                Assign
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border-2 ${getSubjectAccent(test.subject)} hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1`}>
      <div className={`bg-gradient-to-r ${getSubjectGradient(test.subject)} px-6 py-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 leading-tight">{test.testName}</h3>
            <p className="text-blue-100 text-sm font-medium">{test.subject}</p>
          </div>
          <div className={`${status.color} text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg ml-4`}>
            <StatusIcon size={14} />
            {status.text}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{test.testDescription}</p>

        <div className="flex flex-wrap gap-2">
          {test.testType && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getTestTypeBadge(test.testType)}`}>
              {test.testType}
            </span>
          )}
          {test.difficulty && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getDifficultyBadge(test.difficulty)}`}>
              <Target className="inline w-3 h-3 mr-1" />
              {test.difficulty}
            </span>
          )}
        </div>

        {test.topics && test.topics.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-gray-900"
            >
              <span className="flex items-center gap-1">
                <Info size={14} />
                Topics Covered ({test.topics.length})
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expanded && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {test.topics.map((topic, index) => (
                  <span key={index} className="px-2.5 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-300 font-medium shadow-sm">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium mb-1">Questions</p>
            <p className="text-xl font-bold text-blue-900">{test.numberOfQuestions}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-green-600 font-medium mb-1">Total Marks</p>
            <p className="text-xl font-bold text-green-900">{test.totalMarks}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xs text-orange-600 font-medium mb-1">Duration</p>
            <p className="text-xl font-bold text-orange-900">{test.duration} min</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <p className="text-xs text-gray-600 font-medium mb-1">Created</p>
            <p className="text-xs font-bold text-gray-900">{formatDateShort(test.createdAt)}</p>
          </div>
        </div>

        {(test.assignmentCount !== undefined || test.completionRate !== undefined || test.averageScore !== undefined) && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
            <h4 className="text-xs font-semibold text-teal-800 mb-3 flex items-center gap-1">
              <TrendingUp size={14} />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {test.assignmentCount !== undefined && (
                <div className="text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                  <p className="text-lg font-bold text-teal-900">{test.assignmentCount}</p>
                  <p className="text-xs text-teal-600">Assigned</p>
                </div>
              )}
              {test.completionRate !== undefined && (
                <div className="text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-lg font-bold text-green-900">{test.completionRate}%</p>
                  <p className="text-xs text-green-600">Completed</p>
                </div>
              )}
              {test.averageScore !== undefined && (
                <div className="text-center">
                  <Award className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <p className="text-lg font-bold text-amber-900">{test.averageScore}%</p>
                  <p className="text-xs text-amber-600">Avg Score</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                <Calendar size={12} />
                Start Date
              </p>
              <p className="text-sm text-gray-900 font-semibold">{formatDate(test.startDateTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                <Calendar size={12} />
                End Date
              </p>
              <p className="text-sm text-gray-900 font-semibold">{formatDate(test.endDateTime)}</p>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onView(test._id)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <Eye size={16} />
                Preview
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(test._id)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}
              <button
                onClick={() => onAssign(test._id)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <Send size={16} />
                Assign
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(test._id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            {onReport && (
              <button
                onClick={() => onReport(test._id)}
                className="w-full bg-gradient-to-r from-violet-500 to-violet-600 text-white py-3 px-4 rounded-xl hover:from-violet-600 hover:to-violet-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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

export default AdvancedTestCard;
