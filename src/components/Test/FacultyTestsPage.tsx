import React, { useState, useEffect } from 'react';
import { Clock, Calendar, FileText, Users, Play, CheckCircle, AlertCircle } from 'lucide-react';
import apiService from '../../services/api';
import CategorizedTestTabs from './CategorizedTestTabs';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Test {
  _id: string;
  testId: {
    _id: string;
    testName: string;
    testDescription: string;
    subject: string;
    testType: string;
    difficulty?: string;
    numberOfQuestions: number;
    totalMarks: number;
    duration: number;
    startDateTime: string;
    endDateTime: string;
    companyName?: string;
  };
  status: string;
  assignedStudentsCount?: number;
}

const FacultyTestsPage: React.FC = () => {
  const [assignedTests, setAssignedTests] = useState<Test[]>([]);
  const [testCounts, setTestCounts] = useState<any>(null);
  const [dropdownCounts, setDropdownCounts] = useState<any>(null);
  const [activeTestType, setActiveTestType] = useState('Assessment');
  const [activeSubject, setActiveSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTests(activeTestType, activeSubject);
  }, []);

  const loadTests = async (testType: string, subject: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getCollegeAssignedTests(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );

      setAssignedTests(data);

      const allTests = await apiService.getCollegeAssignedTests();

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

      // Calculate counts for dropdown
      const dropdownCounts = {
        assessment: allTests.filter((t: any) => t.testId.testType === 'Assessment').length,
        practice: allTests.filter((t: any) => t.testId.testType === 'Practice').length,
        mockTest: allTests.filter((t: any) => t.testId.testType === 'Mock Test').length,
        company: allTests.filter((t: any) => t.testId.testType === 'Specific Company Test').length
      };
      setDropdownCounts(dropdownCounts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'accepted': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  const isTestActive = (test: Test) => {
    const now = new Date();
    const start = new Date(test.testId.startDateTime);
    const end = new Date(test.testId.endDateTime);
    return now >= start && now <= end;
  };

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const start = new Date(test.testId.startDateTime);
    const end = new Date(test.testId.endDateTime);

    if (now < start) return { text: 'Upcoming', icon: Clock, color: 'text-yellow-600' };
    if (now > end) return { text: 'Ended', icon: AlertCircle, color: 'text-red-600' };
    return { text: 'Active', icon: Play, color: 'text-green-600' };
  };

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
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
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
          <h2 className="text-2xl font-bold text-gray-900">Tests</h2>
          <p className="text-gray-600 mt-1">View and manage assigned tests</p>
        </div>
      </div>

      <div className="grid gap-6">
        {assignedTests.map((test) => {
          const testStatus = getTestStatus(test);
          const StatusIcon = testStatus.icon;

          return (
            <div key={test._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {test.testId.testName}
                    </h3>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(test.status)}`}>
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTestTypeColor(test.testId.testType)}`}>
                      {test.testId.testType}
                    </span>

                    {test.testId.difficulty && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.testId.difficulty)}`}>
                        {test.testId.difficulty}
                      </span>
                    )}

                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${testStatus.color} bg-gray-100`}>
                      <StatusIcon size={14} />
                      {testStatus.text}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{test.testId.testDescription}</p>

                  {test.testId.companyName && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Company: {test.testId.companyName}
                      </span>
                    </div>
                  )}

                  {test.testId.testType === 'Practice' && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Students get instant feedback
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Subject</p>
                  <p className="font-semibold text-blue-700">{test.testId.subject}</p>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Questions</p>
                  <p className="font-semibold text-green-700">{test.testId.numberOfQuestions}</p>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-purple-700">{test.testId.duration} min</p>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Marks</p>
                  <p className="font-semibold text-orange-700">{test.testId.totalMarks}</p>
                </div>

                {test.assignedStudentsCount !== undefined && (
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Students</p>
                    <p className="font-semibold text-indigo-700">{test.assignedStudentsCount}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Start: {formatDate(test.testId.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>End: {formatDate(test.testId.endDateTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {assignedTests.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-200">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">
            No tests available for the selected category and subject.
          </p>
        </div>
      )}
    </div>
  );
};

export default FacultyTestsPage;
