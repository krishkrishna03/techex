import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Users, TrendingUp, BarChart3, Award, Clock } from 'lucide-react';
import apiService from '../../services/api';
import CategorizedTestTabs from './CategorizedTestTabs';
import LoadingSpinner from '../UI/LoadingSpinner';
import TestAnalyticsModal from './TestAnalyticsModal';

interface AssignedTest {
  _id: string;
  testId: {
    _id: string;
    testName: string;
    testType: string;
    subject: string;
    difficulty?: string;
    companyName?: string;
    totalMarks: number;
    numberOfQuestions: number;
    duration: number;
  };
  assignedDate: string;
  totalStudents: number;
  completed: number;
  avgScore: string;
  status: string;
}

const FacultyTestReports: React.FC = () => {
  const [assignedTests, setAssignedTests] = useState<AssignedTest[]>([]);
  const [testCounts, setTestCounts] = useState<any>(null);
  const [activeTestType, setActiveTestType] = useState('Assessment');
  const [activeSubject, setActiveSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  useEffect(() => {
    loadTests(activeTestType, activeSubject);
  }, []);

  const loadTests = async (testType: string, subject: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getFacultyAssignedTests(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );

      setAssignedTests(data);

      const allTests = await apiService.getFacultyAssignedTests();

      const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];

      const counts = {
        assessment: {} as { [key: string]: number },
        practice: {} as { [key: string]: number },
        mockTest: {} as { [key: string]: number },
        company: {} as { [key: string]: number }
      };

      subjects.forEach(sub => {
        counts.assessment[sub] = allTests.filter((t: any) =>
          t.testId.testType === 'Assessment' && t.testId.subject === sub
        ).length;

        counts.practice[sub] = allTests.filter((t: any) =>
          t.testId.testType === 'Practice' && t.testId.subject === sub
        ).length;

        counts.mockTest[sub] = allTests.filter((t: any) =>
          t.testId.testType === 'Mock Test' && t.testId.subject === sub
        ).length;

        counts.company[sub] = allTests.filter((t: any) =>
          t.testId.testType === 'Specific Company Test' && t.testId.subject === sub
        ).length;
      });

      setTestCounts(counts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (testId: string, format: 'json' | 'csv', testName: string) => {
    try {
      const result = await apiService.exportFacultyTestResults(testId, format);

      if (format === 'csv' && result instanceof Blob) {
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${testName}_results.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${testName}_results.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Failed to export results');
    }
  };

  const handleViewReport = (testId: string) => {
    setSelectedTestId(testId);
    setShowAnalyticsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTestTypeColor = (testType: string) => {
    const colors = {
      'Assessment': 'bg-blue-100 text-blue-800',
      'Practice': 'bg-green-100 text-green-800',
      'Mock Test': 'bg-orange-100 text-orange-800',
      'Specific Company Test': 'bg-red-100 text-red-800'
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

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'text-green-600 bg-green-50';
    if (numScore >= 60) return 'text-blue-600 bg-blue-50';
    if (numScore >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const calculateOverallStats = () => {
    if (assignedTests.length === 0) return null;

    const totalStudents = assignedTests.reduce((sum, test) => sum + test.totalStudents, 0);
    const totalCompleted = assignedTests.reduce((sum, test) => sum + test.completed, 0);
    const avgScoreAll = assignedTests.reduce((sum, test) => sum + parseFloat(test.avgScore), 0) / assignedTests.length;

    return {
      totalTests: assignedTests.length,
      totalStudents,
      totalCompleted,
      avgScore: avgScoreAll.toFixed(1),
      completionRate: totalStudents > 0 ? ((totalCompleted / totalStudents) * 100).toFixed(1) : '0'
    };
  };

  const stats = calculateOverallStats();

  if (loading && !testCounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-12">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <button
          onClick={() => loadTests(activeTestType, activeSubject)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">View performance analytics for assigned tests</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Tests</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Students Assigned</p>
                <p className="text-2xl font-bold text-gray-700">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Score</p>
                <p className="text-2xl font-bold text-orange-700">{stats.avgScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-sm text-indigo-600 font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CategorizedTestTabs
        onFilterChange={(testType, subject) => {
          setActiveTestType(testType);
          setActiveSubject(subject);
          loadTests(testType, subject);
        }}
        testCounts={testCounts}
        loading={loading}
      />

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignedTests.map((test) => (
                <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {test.testId.testName}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {test.testId.subject}
                        </span>
                        {test.testId.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(test.testId.difficulty)}`}>
                            {test.testId.difficulty}
                          </span>
                        )}
                        {test.testId.companyName && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            {test.testId.companyName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        {test.testId.duration} min | {test.testId.numberOfQuestions} questions
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTestTypeColor(test.testId.testType)}`}>
                      {test.testId.testType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(test.assignedDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Users size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-semibold text-gray-900">{test.totalStudents}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {test.completed} / {test.totalStudents}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getCompletionRate(test.completed, test.totalStudents)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {getCompletionRate(test.completed, test.totalStudents)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${getScoreColor(test.avgScore)}`}>
                      {test.avgScore}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewReport(test.testId._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        title="View Report"
                      >
                        <Eye size={14} />
                        Report
                      </button>
                      <button
                        onClick={() => handleExport(test.testId._id, 'csv', test.testId.testName)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        title="Export CSV"
                      >
                        <Download size={14} />
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignedTests.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-200">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No test reports found</h3>
          <p className="text-gray-600">
            No tests have been assigned for the selected category and subject.
          </p>
        </div>
      )}

      {showAnalyticsModal && selectedTestId && (
        <TestAnalyticsModal
          testId={selectedTestId}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedTestId(null);
          }}
        />
      )}
    </div>
  );
};

export default FacultyTestReports;
