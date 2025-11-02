import React, { useState, useEffect } from 'react';
import { Plus, Building, Users, GraduationCap, TrendingUp, CheckCircle, Clock, FileText, BarChart3, AlertCircle, BookOpen, Activity, Search, Filter, Eye, CreditCard as Edit, Trash2, Settings, Bell } from 'lucide-react';
import apiService from '../../services/api';
import Modal from '../../components/UI/Modal';
import CollegeForm from '../../components/Forms/CollegeForm';
import TestForm from '../../components/Test/TestForm';
import TestCard from '../../components/Test/TestCard';
import AdvancedTestGrid from '../../components/Test/AdvancedTestGrid';
import TestAssignmentModal from '../../components/Test/TestAssignmentModal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import NotificationForm from '../../components/Notifications/NotificationForm';
import NotificationsPage from '../../components/Notifications/NotificationsPage';
import AnalyticsCard from '../../components/Dashboard/AnalyticsCard';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import PendingActions from '../../components/Dashboard/PendingActions';
import PlatformGrowth from '../../components/Dashboard/PlatformGrowth';
import TestTabs from '../../components/Test/TestTabs';
import ExportButton from '../../components/Dashboard/ExportButton';
import GrowthChart from '../../components/Charts/GrowthChart';
import CategorizedTestTabs from '../../components/Test/CategorizedTestTabs';
import TestFormWithSections from '../../components/Test/TestFormWithSections';
import CodingQuestionsList from '../../components/Coding/CodingQuestionsList';

interface College {
  id: string;
  name: string;
  code: string;
  email: string;
  address: string;
  totalFaculty: number;
  totalStudents: number;
  adminInfo?: {
    name: string;
    email: string;
    hasLoggedIn: boolean;
    lastLogin?: string;
  };
  createdAt: string;
  isActive: boolean;
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

interface RecentLogin {
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  collegeId?: {
    name: string;
  };
}

interface AdminStats {
  totalColleges: number;
  totalFaculty: number;
  totalStudents: number;
  recentLogins: RecentLogin[];
}

interface DashboardStats {
  totalColleges: number;
  totalStudents: number;
  activeExams: number;
  completedTests: number;
  pendingActions: {
    aiTestRequests: number;
    newCollegeApplications: number;
    testsCompletedToday: number;
  };
  platformGrowth: {
    collegeGrowth: number;
    studentEnrollment: number;
    testCompletionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    college?: string;
  }>;
}

interface TestFormData {
  testName: string;
  testDescription: string;
  subject: 'Verbal' | 'Reasoning' | 'Technical' | 'Arithmetic' | 'Communication';
  testType: 'Assessment' | 'Practice' | 'Assignment';
  topics: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numberOfQuestions: number;
  marksPerQuestion: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  questions: Array<{
    questionText: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    marks: number;
  }>;
}

interface MasterAdminDashboardProps {
  activeTab: string;
}

const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({ activeTab }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTestType, setActiveTestType] = useState('Assessment');
  const [activeSubject, setActiveSubject] = useState('all');
  const [testCounts, setTestCounts] = useState<any>(null);
  const [dropdownCounts, setDropdownCounts] = useState<any>(null);
  const [categorizedCounts, setCategorizedCounts] = useState<any>(null);
  const [showCollegeForm, setShowCollegeForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'colleges' || activeTab === 'college-management' || activeTab === 'dashboard' || activeTab === 'stats') {
      loadData();
      loadAnalyticsData();
    } else if (activeTab === 'tests') {
      loadTests(activeTestType, activeSubject);
    }
  }, [activeTab, activeTestType, activeSubject]);

  useEffect(() => {
    const handleTestTypeChange = (event: any) => {
      const testType = event.detail?.testType;
      if (testType) {
        setActiveTestType(testType);
        setActiveSubject('all');
      }
    };

    window.addEventListener('testTypeChanged', handleTestTypeChange);
    return () => {
      window.removeEventListener('testTypeChanged', handleTestTypeChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collegesData, statsData] = await Promise.all([
        apiService.getColleges(),
        apiService.getAdminStats()
      ]);
      setColleges(collegesData);
      setStats(statsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await apiService.getDashboardStats();
      setAnalyticsData(response);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setAnalyticsData(null);
    }
  };

  const loadTests = async (testType?: string, subject?: string) => {
    try {
      setLoading(true);
      const testsData = await apiService.getTests(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );
      setTests(testsData);

      // Calculate test counts for tabs
      const allTests = await apiService.getTests();
      const counts = {
        byType: {
          all: allTests.length,
          Assessment: allTests.filter((t: any) => t.testType === 'Assessment').length,
          Practice: allTests.filter((t: any) => t.testType === 'Practice').length,
          Assignment: allTests.filter((t: any) => t.testType === 'Assignment').length,
          'Mock Test': allTests.filter((t: any) => t.testType === 'Mock Test').length,
          'Specific Company Test': allTests.filter((t: any) => t.testType === 'Specific Company Test').length
        },
        bySubject: {
          all: allTests.length,
          Verbal: allTests.filter((t: any) => t.subject === 'Verbal').length,
          Reasoning: allTests.filter((t: any) => t.subject === 'Reasoning').length,
          Technical: allTests.filter((t: any) => t.subject === 'Technical').length,
          Arithmetic: allTests.filter((t: any) => t.subject === 'Arithmetic').length,
          Communication: allTests.filter((t: any) => t.subject === 'Communication').length
        }
      };
      setTestCounts(counts);

      // Calculate counts for dropdown
      const dropdownCounts = {
        assessment: allTests.filter((t: any) => t.testType === 'Assessment').length,
        practice: allTests.filter((t: any) => t.testType === 'Practice').length,
        mockTest: allTests.filter((t: any) => t.testType === 'Mock Test').length,
        company: allTests.filter((t: any) => t.testType === 'Specific Company Test').length
      };
      setDropdownCounts(dropdownCounts);

      // Calculate categorized counts for CategorizedTestTabs
      const categorizedCounts = {
        assessment: {
          all: allTests.filter((t: any) => t.testType === 'Assessment').length,
          Verbal: allTests.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Verbal').length,
          Reasoning: allTests.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Reasoning').length,
          Technical: allTests.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Technical').length,
          Arithmetic: allTests.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Arithmetic').length,
          Communication: allTests.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Communication').length
        },
        practice: {
          all: allTests.filter((t: any) => t.testType === 'Practice').length,
          Verbal: allTests.filter((t: any) => t.testType === 'Practice' && t.subject === 'Verbal').length,
          Reasoning: allTests.filter((t: any) => t.testType === 'Practice' && t.subject === 'Reasoning').length,
          Technical: allTests.filter((t: any) => t.testType === 'Practice' && t.subject === 'Technical').length,
          Arithmetic: allTests.filter((t: any) => t.testType === 'Practice' && t.subject === 'Arithmetic').length,
          Communication: allTests.filter((t: any) => t.testType === 'Practice' && t.subject === 'Communication').length
        },
        mockTest: {
          all: allTests.filter((t: any) => t.testType === 'Mock Test').length,
          Verbal: allTests.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Verbal').length,
          Reasoning: allTests.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Reasoning').length,
          Technical: allTests.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Technical').length,
          Arithmetic: allTests.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Arithmetic').length,
          Communication: allTests.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Communication').length
        },
        company: {
          all: allTests.filter((t: any) => t.testType === 'Specific Company Test').length,
          Verbal: allTests.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Verbal').length,
          Reasoning: allTests.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Reasoning').length,
          Technical: allTests.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Technical').length,
          Arithmetic: allTests.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Arithmetic').length,
          Communication: allTests.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Communication').length
        }
      };
      setCategorizedCounts(categorizedCounts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async (collegeData: {
    name: string;
    code: string;
    email: string;
    address: string;
  }) => {
    try {
      setFormLoading(true);
      await apiService.createCollege(collegeData);
      setShowCollegeForm(false);
      loadData();
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateTest = async (formData: any) => {
    try {
      setFormLoading(true);

      console.log('Creating test with data:', JSON.stringify(formData, null, 2));

      if (formData.hasSections) {
        console.log('Sections count:', formData.sections?.length);
        formData.sections?.forEach((section: any, idx: number) => {
          console.log(`Section ${idx + 1} questions:`, section.questions.length);
        });
      } else {
        console.log('Questions count:', formData.questions?.length);
        console.log('Expected questions:', formData.numberOfQuestions);
      }

      // Convert datetime-local values to ISO strings with proper timezone
      const testData = {
        ...formData,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString()
      };

      const response = await apiService.createTest(testData);
      console.log('Test created successfully:', response);

      setShowTestForm(false);

      // Switch to the newly created test's type tab and reload
      setActiveTestType(formData.testType);
      setActiveSubject('all');
      await loadTests(formData.testType, 'all');

      alert('Test created successfully!');
    } catch (error) {
      console.error('Test creation error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateNotification = async (formData: FormData) => {
    try {
      setFormLoading(true);
      await apiService.createNotificationWithFile(formData);
      setShowNotificationForm(false);
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignTest = async (testId: string, collegeIds: string[]) => {
    try {
      await apiService.assignTestToColleges(testId, collegeIds);
      setShowAssignmentModal(false);
      setSelectedTest(null);
    } catch (error) {
      throw error;
    }
  };

  const [showTestPreview, setShowTestPreview] = useState(false);
  const [previewTest, setPreviewTest] = useState<Test | null>(null);

  const handleViewTest = async (testId: string) => {
    try {
      const testDetails = await apiService.getTest(testId);
      setPreviewTest(testDetails);
      setShowTestPreview(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load test details');
    }
  };

  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const handleEditTest = async (testId: string) => {
    try {
      const testDetails = await apiService.getTest(testId);
      setEditingTest(testDetails);
      setShowTestForm(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load test details');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    const test = tests.find(t => t._id === testId);
    if (!confirm(`Are you sure you want to delete "${test?.testName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteTest(testId);
      loadTests(activeTestType, activeSubject);
      alert('Test deleted successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete test');
    }
  };

  const [showTestReport, setShowTestReport] = useState(false);
  const [testReportData, setTestReportData] = useState<any>(null);

  const handleTestReport = async (testId: string) => {
    try {
      const reportData = await apiService.getMasterTestReport(testId);
      setTestReportData(reportData);
      setShowTestReport(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load test report');
    }
  };

  const handleAssignTestClick = (testId: string) => {
    const test = tests.find(t => t._id === testId);
    if (test) {
      setSelectedTest(test);
      setShowAssignmentModal(true);
    }
  };

  const handlePendingActionClick = (action: string) => {
    switch (action) {
      case 'test-assignments':
        // Navigate to test assignments or show modal
        console.log('Navigate to test assignments');
        break;
      case 'college-credentials':
        // Navigate to colleges with pending credentials
        setActiveTab('colleges');
        break;
      case 'resend-credentials':
        // Implement resend credentials functionality
        console.log('Resend credentials');
        break;
    }
  };
  const toggleCollegeStatus = async (collegeId: string) => {
    try {
      await apiService.toggleCollegeStatus(collegeId);
      loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleEditCollege = (college: College) => {
    setEditingCollege(college);
    setShowEditForm(true);
  };

  const handleUpdateCollege = async (collegeData: {
    name: string;
    code: string;
    email: string;
    address: string;
  }) => {
    try {
      setFormLoading(true);
      if (!editingCollege) return;
      await apiService.updateCollege(editingCollege.id, collegeData);
      setShowEditForm(false);
      setEditingCollege(null);
      loadData();
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleManageAdmin = (college: College) => {
    // Open admin management modal or navigate to admin management page
    console.log('Manage admin for college:', college.name);
    // This could open a modal to reset admin password, change admin details, etc.
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activeTab === 'stats' && stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-gray-700" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Colleges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalColleges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-700" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFaculty}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-gray-700" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Recent Login Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentLogins.map((login, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{login.name}</div>
                        <div className="text-sm text-gray-500">{login.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {login.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {login.collegeId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {login.lastLogin ? formatDate(login.lastLogin) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return <NotificationsPage />;
  }

  if (activeTab === 'coding-questions') {
    return <CodingQuestionsList />;
  }

  if (activeTab === 'notifications-old') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
          <button
            onClick={() => setShowNotificationForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Notification
          </button>
        </div>

        <Modal
          isOpen={showNotificationForm}
          onClose={() => setShowNotificationForm(false)}
          title="Create New Notification"
          size="lg"
        >
          <NotificationForm 
            onSubmit={handleCreateNotification} 
            loading={formLoading}
            onClose={() => setShowNotificationForm(false)}
          />
        </Modal>
      </div>
    );
  }

  if (activeTab === 'tests') {
    const handleFilterChange = (testType: string, subject: string) => {
      setActiveTestType(testType);
      setActiveSubject(subject);
      loadTests(testType, subject);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Test Management</h2>
          <button
            onClick={() => setShowTestForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Test
          </button>
        </div>

        <CategorizedTestTabs
          onFilterChange={handleFilterChange}
          testCounts={categorizedCounts}
          loading={loading}
        />

        <AdvancedTestGrid
          tests={tests}
          onView={handleViewTest}
          onAssign={handleAssignTestClick}
          onEdit={handleEditTest}
          onDelete={handleDeleteTest}
          onReport={handleTestReport}
          loading={loading}
        />

        <Modal
          isOpen={showTestForm}
          onClose={() => {
            setShowTestForm(false);
            setEditingTest(null);
          }}
          title={editingTest ? "Edit Test" : "Create New Test"}
          size="xl"
        >
          <TestFormWithSections
            onSubmit={editingTest ? async (data) => {
              await apiService.updateTest(editingTest._id, data);
              setShowTestForm(false);
              setEditingTest(null);
              loadTests(activeTestType, activeSubject);
            } : handleCreateTest}
            loading={formLoading}
            initialData={editingTest}
          />
        </Modal>

        {selectedTest && (
          <Modal
            isOpen={showAssignmentModal}
            onClose={() => {
              setShowAssignmentModal(false);
              setSelectedTest(null);
            }}
            title="Assign Test to Colleges"
            size="lg"
          >
            <TestAssignmentModal
              testId={selectedTest._id}
              testName={selectedTest.testName}
              onClose={() => {
                setShowAssignmentModal(false);
                setSelectedTest(null);
              }}
              onAssign={handleAssignTest}
            />
          </Modal>
        )}

        {previewTest && (
          <Modal
            isOpen={showTestPreview}
            onClose={() => {
              setShowTestPreview(false);
              setPreviewTest(null);
            }}
            title={`Preview: ${previewTest.testName}`}
            size="xl"
          >
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-gray-600 mb-2">{previewTest.testDescription}</p>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-semibold">{previewTest.subject}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-sm text-gray-600">Questions</p>
                    <p className="font-semibold">{previewTest.numberOfQuestions}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{previewTest.duration} min</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="font-semibold">{previewTest.totalMarks}</p>
                  </div>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {(previewTest as any).questions?.map((q: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{index + 1}. {q.questionText}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(q.options).map(([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className={`p-2 rounded ${key === q.correctAnswer ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}
                        >
                          <span className="font-medium">{key})</span> {value}
                          {key === q.correctAnswer && <span className="ml-2 text-green-600 text-xs">✓ Correct</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {testReportData && (
          <Modal
            isOpen={showTestReport}
            onClose={() => {
              setShowTestReport(false);
              setTestReportData(null);
            }}
            title="Test Report & Analytics"
            size="xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{testReportData.totalAssigned || 0}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{testReportData.totalAttempted || 0}</p>
                  <p className="text-sm text-gray-600">Attempted</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{testReportData.averageScore ? testReportData.averageScore.toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{testReportData.completionRate ? testReportData.completionRate.toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-600">Completion</p>
                </div>
              </div>

              {testReportData.collegeResults && testReportData.collegeResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">College-wise Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempted</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {testReportData.collegeResults.map((result: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{result.collegeName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.assigned}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.attempted}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.averageScore ? result.averageScore.toFixed(1) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (activeTab === 'colleges') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Colleges Management</h2>
          <button
            onClick={() => setShowCollegeForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add College
          </button>
        </div>

        <div className="grid gap-6">
          {Array.isArray(colleges) && colleges.length > 0 ? colleges.map((college) => (
            <div key={college.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {college.code}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      college.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {college.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2">{college.email}</p>
                  <p className="text-gray-600 text-sm mb-4">{college.address}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 border rounded">
                      <p className="text-2xl font-bold text-gray-900">{college.totalFaculty || 0}</p>
                      <p className="text-sm text-gray-600">Faculty</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 border rounded">
                      <p className="text-2xl font-bold text-gray-900">{college.totalStudents || 0}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                  </div>

                  {college.adminInfo && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">College Admin: {college.adminInfo.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {college.adminInfo.hasLoggedIn ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-orange-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {college.adminInfo.hasLoggedIn
                            ? `Last login: ${college.adminInfo.lastLogin ? formatDate(college.adminInfo.lastLogin) : 'Unknown'}`
                            : 'Never logged in'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => toggleCollegeStatus(college.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      college.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {college.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEditCollege(college)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm"
                  >
                    Edit
                  </button>
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(college.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No colleges found</p>
            </div>
          )}
        </div>

        <Modal
          isOpen={showCollegeForm}
          onClose={() => setShowCollegeForm(false)}
          title="Create New College"
          size="md"
        >
          <CollegeForm onSubmit={handleCreateCollege} loading={formLoading} />
        </Modal>

        <Modal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingCollege(null);
          }}
          title="Edit College"
          size="md"
        >
          {editingCollege && (
            <CollegeForm 
              onSubmit={handleUpdateCollege} 
              loading={formLoading}
              initialData={{
                name: editingCollege.name,
                code: editingCollege.code,
                email: editingCollege.email,
                address: editingCollege.address
              }}
            />
          )}
        </Modal>
      </div>
    );
  }

  // College Management view
  if (activeTab === 'college-management') {
    const filteredColleges = colleges.filter(college =>
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8" />
              College Management
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCollegeForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add College
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Trash2 size={20} />
              Delete College
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search colleges by name, code, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* College Cards */}
        <div className="grid gap-6">
          {Array.isArray(filteredColleges) && filteredColleges.length > 0 ? filteredColleges.map((college) => (
            <div key={college.id} className="bg-white rounded-lg shadow border">
              {/* College Card Header */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {college.code}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        college.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {college.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{college.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{college.address}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 border rounded">
                        <p className="text-2xl font-bold text-gray-900">{college.totalStudents}</p>
                        <p className="text-sm text-gray-600">Students</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 border rounded">
                        <p className="text-2xl font-bold text-gray-900">{college.totalFaculty}</p>
                        <p className="text-sm text-gray-600">Batches</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 border rounded">
                        <p className="text-2xl font-bold text-gray-900">0</p>
                        <p className="text-sm text-gray-600">Tests</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 border rounded">
                        <p className="text-2xl font-bold text-gray-900">0</p>
                        <p className="text-sm text-gray-600">Tests</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setExpandedCollege(expandedCollege === college.id ? null : college.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button 
                    onClick={() => handleEditCollege(college)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleManageAdmin(college)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    <Settings size={16} />
                    Admin
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCollege === college.id && (
                <div className="border-t bg-gray-50">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {college.name} - Detailed View
                      </h4>
                      <button
                        onClick={() => setExpandedCollege(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b mb-6">
                      <button className="px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-medium">
                        <Building className="inline h-4 w-4 mr-2" />
                        Batches
                      </button>
                      <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                        <Users className="inline h-4 w-4 mr-2" />
                        Streams
                      </button>
                      <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                        <FileText className="inline h-4 w-4 mr-2" />
                        Test Assignments
                      </button>
                      <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                        <Settings className="inline h-4 w-4 mr-2" />
                        Features
                      </button>
                    </div>

                    {/* Batch Content */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">Batch 2024</h5>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">3 Streams</p>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">1240</p>
                          <p className="text-sm text-gray-600">Total Students</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">Batch 2025</h5>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">2 Streams</p>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">980</p>
                          <p className="text-sm text-gray-600">Total Students</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">Batch 2026</h5>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">2 Streams</p>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">650</p>
                          <p className="text-sm text-gray-600">Total Students</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No colleges found matching your search</p>
            </div>
          )}
        </div>

        {/* Modals */}
        <Modal
          isOpen={showCollegeForm}
          onClose={() => setShowCollegeForm(false)}
          title="Create New College"
          size="md"
        >
          <CollegeForm onSubmit={handleCreateCollege} loading={formLoading} />
        </Modal>

        <Modal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingCollege(null);
          }}
          title="Edit College"
          size="md"
        >
          <CollegeForm 
            onSubmit={handleUpdateCollege} 
            loading={formLoading}
            initialData={editingCollege ? {
              name: editingCollege.name,
              code: editingCollege.code,
              email: editingCollege.email,
              address: editingCollege.address
            } : undefined}
          />
        </Modal>
      </div>
    );
  }

  // Default dashboard view - Main Dashboard like in the image
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date().toLocaleString()} • 
            {analyticsData ? ' Live data' : ' Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome, Master</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowNotificationForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Bell size={16} />
                Send Notification
              </button>
              <button
                onClick={() => setShowTestForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Create Test
              </button>
            </div>
          </div>
          {analyticsData && (
            <ExportButton 
              data={analyticsData} 
              filename="dashboard-analytics"
              title="Dashboard Analytics Report"
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Colleges"
          value={analyticsData?.overview?.totalColleges || stats?.totalColleges || 0}
          icon={Building}
          iconColor="text-blue-600"
          trend={{
            value: analyticsData?.platformGrowth?.collegeGrowthPercentage || 0,
            isPositive: (analyticsData?.platformGrowth?.collegeGrowthPercentage || 0) >= 0
          }}
          onClick={() => setActiveTab('colleges')}
        />
        
        <AnalyticsCard
          title="Total Students"
          value={analyticsData?.overview?.totalStudents || stats?.totalStudents || 0}
          icon={GraduationCap}
          iconColor="text-green-600"
          trend={{
            value: analyticsData?.platformGrowth?.studentGrowthPercentage || 0,
            isPositive: (analyticsData?.platformGrowth?.studentGrowthPercentage || 0) >= 0
          }}
        />
        
        <AnalyticsCard
          title="Active Exams"
          value={analyticsData?.overview?.activeExams || 0}
          subtitle="Currently running"
          icon={BookOpen}
          iconColor="text-purple-600"
          onClick={() => setActiveTab('tests')}
        />

        <AnalyticsCard
          title="Completed Tests"
          value={analyticsData?.overview?.completedTests || 0}
          icon={BarChart3}
          iconColor="text-orange-600"
          trend={{
            value: analyticsData?.platformGrowth?.testCompletionGrowthPercentage || 0,
            isPositive: (analyticsData?.platformGrowth?.testCompletionGrowthPercentage || 0) >= 0
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyticsData?.pendingActions && (
          <PendingActions 
            data={analyticsData.pendingActions}
            onActionClick={handlePendingActionClick}
          />
        )}

        {analyticsData?.platformGrowth && (
          <PlatformGrowth data={analyticsData.platformGrowth} />
        )}
      </div>

      {analyticsData?.recentActivity && (
        <RecentActivity activities={analyticsData.recentActivity} />
      )}

      {/* Growth Charts */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GrowthChart
            title="User Growth Trend"
            data={{
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [
                {
                  label: 'Students',
                  data: [
                    Math.max(0, analyticsData.platformGrowth.newStudents - 15),
                    Math.max(0, analyticsData.platformGrowth.newStudents - 10),
                    Math.max(0, analyticsData.platformGrowth.newStudents - 5),
                    analyticsData.platformGrowth.newStudents
                  ],
                  color: '#10B981'
                },
                {
                  label: 'Faculty',
                  data: [
                    Math.max(0, analyticsData.platformGrowth.newFaculty - 5),
                    Math.max(0, analyticsData.platformGrowth.newFaculty - 3),
                    Math.max(0, analyticsData.platformGrowth.newFaculty - 1),
                    analyticsData.platformGrowth.newFaculty
                  ],
                  color: '#3B82F6'
                }
              ]
            }}
            type="line"
          />
          
          <GrowthChart
            title="Subject-wise Test Distribution"
            data={{
              labels: ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'],
              datasets: [
                {
                  label: 'Tests Created',
                  data: [
                    testCounts?.bySubject?.Verbal || 0,
                    testCounts?.bySubject?.Reasoning || 0,
                    testCounts?.bySubject?.Technical || 0,
                    testCounts?.bySubject?.Arithmetic || 0,
                    testCounts?.bySubject?.Communication || 0
                  ],
                  color: '#8B5CF6'
                }
              ]
            }}
            type="bar"
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showCollegeForm}
        onClose={() => setShowCollegeForm(false)}
        title="Create New College"
        size="md"
      >
        <CollegeForm onSubmit={handleCreateCollege} loading={formLoading} />
      </Modal>

      <Modal
        isOpen={showTestForm}
        onClose={() => setShowTestForm(false)}
        title="Create New Test"
        size="xl"
      >
        <TestFormWithSections onSubmit={handleCreateTest} loading={formLoading} />
      </Modal>

      <Modal
        isOpen={showNotificationForm}
        onClose={() => setShowNotificationForm(false)}
        title="Create New Notification"
        size="lg"
      >
        <NotificationForm 
          onSubmit={handleCreateNotification} 
          loading={formLoading}
          onClose={() => setShowNotificationForm(false)}
        />
      </Modal>
    </div>
  );
};

export default MasterAdminDashboard;
