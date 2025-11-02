import React, { useState, useEffect, useRef } from 'react';
import { Users, BookOpen, Building, FileText, Clock, Play, CheckCircle, XCircle, TrendingUp, Award, Target, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import StudentTestInterface from '../../components/Test/StudentTestInterface';
import ProctoredTestInterface from '../../components/Test/ProctoredTestInterface';
import SectionedTestInterface from '../../components/Test/SectionedTestInterface';
import TestResults from '../../components/Test/TestResults';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CategorizedTestTabs from '../../components/Test/CategorizedTestTabs';
import StudentReportsPage from '../../components/Test/StudentReportsPage';
import StudentPerformanceAnalytics from '../../components/Test/StudentPerformanceAnalytics';
import DetailedTestReportModal from '../../components/Test/DetailedTestReportModal';
import ProfessionalTestInterface from '../../components/Test/ProfessionalTestInterface';
import PracticeCoding from '../../components/Coding/PracticeCoding';

interface College {
  name: string;
  code: string;
  address: string;
}

interface Colleague {
  _id: string;
  name: string;
  email: string;
  branch: string;
  batch: string;
  section: string;
}

interface DashboardData {
  college: College;
  colleagues: Colleague[];
}

interface AssignedTest {
  _id: string;
  testId: {
    _id: string;
    testName: string;
    testDescription: string;
    subject: string;
    testType?: string;
    difficulty?: string;
    numberOfQuestions: number;
    totalMarks: number;
    duration: number;
    startDateTime: string;
    endDateTime: string;
  };
  hasAttempted: boolean;
  attempt?: any;
}

interface StudentDashboardProps {
  activeTab: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const { state } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assignedTests, setAssignedTests] = useState<AssignedTest[]>([]);
  const [activeTestType, setActiveTestType] = useState('Assessment');
  const [dropdownCounts, setDropdownCounts] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState('all');
  const [testCounts, setTestCounts] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showInstantResults, setShowInstantResults] = useState(false);
  const [instantResults, setInstantResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [startingTest, setStartingTest] = useState(false);
  const testModeDispatchedRef = useRef(false);

  // Notify parent when entering/exiting test mode
  useEffect(() => {
    if (activeTest && testStartTime && !testModeDispatchedRef.current) {
      console.log('Dispatching testModeChanged: true');
      window.dispatchEvent(new CustomEvent('testModeChanged', { detail: { isTestMode: true } }));
      testModeDispatchedRef.current = true;
      return () => {
        console.log('Cleanup: Dispatching testModeChanged: false');
        window.dispatchEvent(new CustomEvent('testModeChanged', { detail: { isTestMode: false } }));
        testModeDispatchedRef.current = false;
      };
    } else if (!activeTest || !testStartTime) {
      if (testModeDispatchedRef.current) {
        console.log('No active test: Dispatching testModeChanged: false');
        window.dispatchEvent(new CustomEvent('testModeChanged', { detail: { isTestMode: false } }));
        testModeDispatchedRef.current = false;
      }
    }
  }, [activeTest, testStartTime]);

  useEffect(() => {
    // Don't reload data when a test is active
    if (activeTest && testStartTime) {
      return;
    }

    if (activeTab === 'dashboard' || activeTab === 'profile') {
      loadDashboardData();
    } else if (activeTab === 'my-tests') {
      // Check if there's a stored test type from sidebar
      const storedTestType = sessionStorage.getItem('selectedTestType');
      if (storedTestType && storedTestType !== activeTestType) {
        setActiveTestType(storedTestType);
        loadAssignedTests(storedTestType, activeSubject);
        sessionStorage.removeItem('selectedTestType');
      } else {
        loadAssignedTests(activeTestType, activeSubject);
      }
    } else if (activeTab === 'performance') {
      loadPerformanceData();
    }
  }, [activeTab, activeTestType, activeSubject, activeTest, testStartTime]);

  // Listen for test type changes from sidebar
  useEffect(() => {
    const handleTestTypeChange = (event: CustomEvent) => {
      const { testType } = event.detail;
      setActiveTestType(testType);
    };

    window.addEventListener('testTypeChanged', handleTestTypeChange as EventListener);
    return () => {
      window.removeEventListener('testTypeChanged', handleTestTypeChange as EventListener);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCollegeDashboard();
      setDashboardData(data);
      await loadAssignedTests();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const reports = await apiService.getStudentReports();
      setPerformanceData(reports);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedTests = async (testType?: string, subject?: string) => {
    try {
      setLoading(true);
      const data = await apiService.getStudentAssignedTests(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );
      setAssignedTests(data);

      // Calculate test counts by category and subject
      const allTests = await apiService.getStudentAssignedTests();

      const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];

      const counts = {
        assessment: {} as { [key: string]: number },
        practice: {} as { [key: string]: number },
        mockTest: {} as { [key: string]: number },
        company: {} as { [key: string]: number }
      };

      subjects.forEach(subject => {
        counts.assessment[subject] = allTests.filter((t: any) =>
          t.testId.testType === 'Assessment' && t.testId.subject === subject
        ).length;

        counts.practice[subject] = allTests.filter((t: any) =>
          t.testId.testType === 'Practice' && t.testId.subject === subject
        ).length;

        counts.mockTest[subject] = allTests.filter((t: any) =>
          t.testId.testType === 'Mock Test' && t.testId.subject === subject
        ).length;

        counts.company[subject] = allTests.filter((t: any) =>
          t.testId.testType === 'Specific Company Test' && t.testId.subject === subject
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
      setError(error instanceof Error ? error.message : 'Failed to load assigned tests');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    if (startingTest) {
      console.log('Test start already in progress');
      return;
    }

    try {
      setStartingTest(true);
      console.log('Starting test with ID:', testId);

      const response = await apiService.startTest(testId);
      console.log('Test start response:', response);

      if (!response.test || !response.startTime) {
        throw new Error('Invalid response from server');
      }

      console.log('Setting active test:', response.test);
      console.log('Setting test start time:', response.startTime);

      setActiveTest(response.test);
      setTestStartTime(new Date(response.startTime));
      setStartingTest(false);

      console.log('Test state updated successfully');
    } catch (error) {
      console.error('Failed to start test:', error);
      alert(error instanceof Error ? error.message : 'Failed to start test');
      setStartingTest(false);
    }
  };

  const handleSubmitTest = async (answers: any[], timeSpent: number, violations?: number) => {
    if (!activeTest || !testStartTime) return;

    try {
      const response = await apiService.submitTest(activeTest._id, answers, testStartTime, timeSpent, violations);
      setActiveTest(null);
      setTestStartTime(null);

      // Handle different test types
      if (response.testType === 'Practice' && response.instantFeedback) {
        // Show instant feedback for practice tests
        setInstantResults(response);
        setShowInstantResults(true);
      } else {
        // Show regular results for Assessment/Assignment tests
        const results = await apiService.getTestResults(activeTest._id);
        setTestResults(results);
        setShowResults(true);
      }

      // Reload assigned tests
      loadAssignedTests();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit test');
    }
  };

  const handleViewResults = async (testId: string) => {
    try {
      const results = await apiService.getTestResults(testId);
      setSelectedReport(results);
      setShowDetailedReport(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load results');
    }
  };

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

  const isTestActive = (test: AssignedTest) => {
    const now = new Date();
    const start = new Date(test.testId.startDateTime);
    const end = new Date(test.testId.endDateTime);
    return now >= start && now <= end;
  };

  const getTestStatus = (test: AssignedTest) => {
    if (test.hasAttempted) return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    
    const now = new Date();
    const start = new Date(test.testId.startDateTime);
    const end = new Date(test.testId.endDateTime);
    
    if (now < start) return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    if (now > end) return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    return { text: 'Available', color: 'bg-blue-100 text-blue-800' };
  };

  const getTestTypeColor = (testType: string) => {
    const colors = {
      'Assessment': 'bg-blue-100 text-blue-800',
      'Practice': 'bg-green-100 text-green-800',
      'Assignment': 'bg-purple-100 text-purple-800'
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

  // Show test interface if test is active
  console.log('StudentDashboard render - activeTest:', activeTest?._id, 'testStartTime:', testStartTime);

  if (activeTest && testStartTime) {
    console.log('Rendering professional test interface');

    return (
      <ProfessionalTestInterface
        test={activeTest}
        startTime={testStartTime}
        onSubmit={handleSubmitTest}
        onExit={() => {
          setActiveTest(null);
          setTestStartTime(null);
        }}
      />
    );
  }

  // Show instant results for practice tests
  if (showInstantResults && instantResults) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Practice Test Complete!</h1>
            <p className="text-gray-600">Here's your instant feedback</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{instantResults.results.marksObtained}</div>
              <div className="text-sm text-gray-600">Marks Obtained</div>
              <div className="text-xs text-gray-500">out of {instantResults.results.totalMarks}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{instantResults.results.percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Percentage</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{instantResults.results.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{instantResults.results.incorrectAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Question-wise Feedback</h3>
            {instantResults.instantFeedback.map((feedback: any, index: number) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  feedback.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {index + 1}. {feedback.question.questionText}
                  </h4>
                  <div className="flex items-center gap-2">
                    {feedback.isCorrect ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {Object.entries(feedback.question.options).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className={`p-2 rounded text-sm ${
                        key === feedback.correctAnswer
                          ? 'bg-green-100 border border-green-300'
                          : key === feedback.selectedAnswer && !feedback.isCorrect
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{key})</span> {value}
                      {key === feedback.correctAnswer && (
                        <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
                      )}
                      {key === feedback.selectedAnswer && key !== feedback.correctAnswer && (
                        <span className="ml-2 text-red-600 text-xs">✗ Your answer</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="text-sm">
                  <p className={`${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {feedback.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setShowInstantResults(false);
                setInstantResults(null);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Show detailed test report
  if (showDetailedReport && selectedReport) {
    return (
      <DetailedTestReportModal
        report={selectedReport}
        onClose={() => {
          setShowDetailedReport(false);
          setSelectedReport(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-12">
        <p>{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activeTab === 'reports') {
    return <StudentReportsPage />;
  }

  if (activeTab === 'my-tests') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Tests</h2>
        </div>

    
        <div className="grid gap-6">
          {assignedTests.map((test) => {
            const status = getTestStatus(test);
            return (
              <div key={test._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.testId.testName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      {test.testId.testType && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestTypeColor(test.testId.testType)}`}>
                          {test.testId.testType}
                        </span>
                      )}
                      {test.testId.difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.testId.difficulty)}`}>
                          {test.testId.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{test.testId.testDescription}</p>
                    {test.testId.testType === 'Practice' && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💡 Get instant feedback after each question!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 border rounded">
                    <p className="text-xs text-gray-600">Subject</p>
                    <p className="font-semibold">{test.testId.subject}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 border rounded">
                    <p className="text-xs text-gray-600">Questions</p>
                    <p className="font-semibold">{test.testId.numberOfQuestions}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 border rounded">
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-semibold">{test.testId.duration} min</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 border rounded">
                    <p className="text-xs text-gray-600">Total Marks</p>
                    <p className="font-semibold">{test.testId.totalMarks}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-3">
                    <p><strong>Available:</strong> {formatDate(test.testId.startDateTime)} - {formatDate(test.testId.endDateTime)}</p>
                  </div>

                  <div className="flex gap-2">
                    {test.hasAttempted ? (
                      <button
                        onClick={() => handleViewResults(test.testId._id)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <CheckCircle size={16} />
                        View Results
                      </button>
                    ) : isTestActive(test) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartTest(test.testId._id);
                        }}
                        disabled={startingTest}
                        className={`text-white py-2 px-4 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          test.testId.testType === 'Practice'
                            ? 'bg-green-600 hover:bg-green-700'
                            : test.testId.testType === 'Mock Test'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : test.testId.testType === 'Specific Company Test'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {startingTest ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            {test.testId.testType === 'Practice' ? 'Start Practice' :
                             test.testId.testType === 'Mock Test' ? 'Start Mock Test' :
                             test.testId.testType === 'Specific Company Test' ? 'Start Company Test' :
                             'Start Test'}
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed flex items-center gap-2 text-sm"
                      >
                        <Clock size={16} />
                        {status.text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {assignedTests.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests assigned yet</h3>
            <p className="text-gray-600">Tests assigned by your college will appear here</p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'profile') {
    if (!dashboardData) {
      return <div className="text-center py-12">Loading profile...</div>;
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <p className="mt-1 text-lg text-gray-900">{state.user?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{state.user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-900">Student</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">College</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">College Code</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.code}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Performance tab
  if (activeTab === 'performance') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Performance</h2>
          <p className="text-gray-600">Track your progress and analyze your test performance</p>
        </div>
        <StudentPerformanceAnalytics testResults={performanceData} />
      </div>
    );
  }

  // Practice Coding tab
  if (activeTab === 'practice-coding') {
    return <PracticeCoding />;
  }

  // Default dashboard view needs dashboardData
  if (!dashboardData) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  // Calculate statistics
  const totalTests = assignedTests.length;
  const completedTests = assignedTests.filter(t => t.hasAttempted).length;
  const pendingTests = assignedTests.filter(t => !t.hasAttempted && isTestActive(t)).length;
  const upcomingTests = assignedTests.filter(t => {
    const now = new Date();
    const start = new Date(t.testId.startDateTime);
    return now < start;
  }).length;

  // Get recent activity
  const recentActivity = assignedTests
    .filter(t => t.hasAttempted)
    .sort((a, b) => {
      const dateA = a.attempt?.submittedAt ? new Date(a.attempt.submittedAt).getTime() : 0;
      const dateB = b.attempt?.submittedAt ? new Date(b.attempt.submittedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Default dashboard view
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Welcome, {state.user?.name}!</h2>
        <p className="text-gray-600">Track your tests and monitor your academic progress</p>
      </div>

      {/* Test Summary Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalTests}</p>
                <p className="text-xs text-gray-500 mt-1">All assigned tests</p>
              </div>
              <FileText className="h-10 w-10 text-gray-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedTests}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalTests > 0 ? `${((completedTests / totalTests) * 100).toFixed(0)}% complete` : 'No tests yet'}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-gray-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingTests}</p>
                <p className="text-xs text-gray-500 mt-1">Active tests to attempt</p>
              </div>
              <Clock className="h-10 w-10 text-gray-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingTests}</p>
                <p className="text-xs text-gray-500 mt-1">Tests scheduled ahead</p>
              </div>
              <Target className="h-10 w-10 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Exam Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Recent Exam Activity</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((test) => {
                const submittedDate = test.attempt?.createdAt
                  ? new Date(test.attempt.createdAt)
                  : null;
                const marksObtained = test.attempt?.marksObtained || 0;
                const totalMarks = test.testId.totalMarks;
                const percentage = test.attempt?.percentage || 0;

                return (
                  <div
                    key={test._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-gray-100 border">
                        <Award className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{test.testId.testName}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>{test.testId.subject}</span>
                          <span>•</span>
                          <span>{marksObtained}/{totalMarks} marks</span>
                          <span>•</span>
                          <span className="font-medium text-gray-900">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {submittedDate ? submittedDate.toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {submittedDate ? submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Testing Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">Testing Timeline</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {assignedTests
              .sort((a, b) => new Date(b.testId.startDateTime).getTime() - new Date(a.testId.startDateTime).getTime())
              .slice(0, 10)
              .map((test) => {
                const status = getTestStatus(test);
                const startDate = new Date(test.testId.startDateTime);
                const isCompleted = test.hasAttempted;

                return (
                  <div key={test._id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-24 text-right text-sm text-gray-600">
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        isCompleted ? 'bg-gray-900' :
                        status.text === 'Available' ? 'bg-gray-700' :
                        status.text === 'Upcoming' ? 'bg-gray-500' :
                        'bg-gray-300'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{test.testId.testName}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {isCompleted ? 'Completed' : status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{test.testId.subject}</p>
                    </div>
                    {isCompleted && test.attempt && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {test.attempt.marksObtained}/{test.testId.totalMarks}
                        </p>
                        <p className="text-xs text-gray-500">
                          {test.attempt.percentage?.toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">College Information</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">College Name</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">College Code</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.address}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
