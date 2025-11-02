import React, { useState, useEffect } from 'react';
import { Plus, Users, GraduationCap, CheckCircle, Clock, FileText, Send, Eye, Upload, Bell, CreditCard as Edit, Trash2, BarChart3 } from 'lucide-react';
import apiService from '../../services/api';
import Modal from '../../components/UI/Modal';
import UserForm from '../../components/Forms/UserForm';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import NotificationForm from '../../components/Notifications/NotificationForm';
import NotificationsPage from '../../components/Notifications/NotificationsPage';
import TestTabs from '../../components/Test/TestTabs';
import BulkUploadForm from '../../components/Forms/BulkUploadForm';
import CollegeTestReport from '../../components/Test/CollegeTestReport';
import CategorizedTestTabs from '../../components/Test/CategorizedTestTabs';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  idNumber: string;
  branch: string;
  batch: string;
  section: string;
  phoneNumber?: string;
  hasLoggedIn: boolean;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
}

interface DashboardData {
  totalFaculty: number;
  totalStudents: number;
  recentUsers: User[];
  loginStats: {
    hasLoggedIn: number;
    neverLoggedIn: number;
  };
}

interface TestAssignment {
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
  assignedBy: {
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  assignedAt: string;
}

interface TestWithStatus {
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
  assignmentStatus: 'pending' | 'accepted' | 'rejected' | 'not_assigned';
  assignedAt?: string;
  assignedBy?: {
    name: string;
    email: string;
  };
  assignmentId?: string;
}

interface CollegeAdminDashboardProps {
  activeTab: string;
}

const CollegeAdminDashboard: React.FC<CollegeAdminDashboardProps> = ({ activeTab }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestAssignment[]>([]);
  const [allTests, setAllTests] = useState<TestWithStatus[]>([]);
  const [activeTestType, setActiveTestType] = useState('Assessment');
  const [activeSubject, setActiveSubject] = useState('all');
  const [dropdownCounts, setDropdownCounts] = useState<any>(null);
  const [categorizedCounts, setCategorizedCounts] = useState<any>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TestAssignment | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestWithStatus | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [defaultRole, setDefaultRole] = useState<'faculty' | 'student'>('student');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestReport, setShowTestReport] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'faculty') {
      loadFaculty();
    } else if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'assigned-tests') {
      loadAssignedTests();
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

  const loadDashboardData = async () => {
    try {
      const data = await apiService.getCollegeDashboard();
      setDashboardData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    }
  };

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCollegeUsers('faculty');
      setFaculty(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCollegeUsers('student');
      setStudents(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedTests = async (testType?: string, subject?: string) => {
    try {
      setLoading(true);
      const typeFilter = testType !== undefined ? testType : activeTestType;
      const subjectFilter = subject !== undefined ? subject : activeSubject;

      const data = await apiService.getAllTestsForCollege(
        typeFilter === 'all' ? undefined : typeFilter,
        subjectFilter === 'all' ? undefined : subjectFilter
      );
      setAllTests(data);

      // Calculate counts for dropdown
      const allTestsData = await apiService.getAllTestsForCollege();
      const dropdownCounts = {
        assessment: allTestsData.filter((t: any) => t.testType === 'Assessment').length,
        practice: allTestsData.filter((t: any) => t.testType === 'Practice').length,
        mockTest: allTestsData.filter((t: any) => t.testType === 'Mock Test').length,
        company: allTestsData.filter((t: any) => t.testType === 'Specific Company Test').length
      };
      setDropdownCounts(dropdownCounts);

      // Calculate categorized counts for CategorizedTestTabs
      const categorizedCounts = {
        assessment: {
          all: allTestsData.filter((t: any) => t.testType === 'Assessment').length,
          Verbal: allTestsData.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Verbal').length,
          Reasoning: allTestsData.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Reasoning').length,
          Technical: allTestsData.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Technical').length,
          Arithmetic: allTestsData.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Arithmetic').length,
          Communication: allTestsData.filter((t: any) => t.testType === 'Assessment' && t.subject === 'Communication').length
        },
        practice: {
          all: allTestsData.filter((t: any) => t.testType === 'Practice').length,
          Verbal: allTestsData.filter((t: any) => t.testType === 'Practice' && t.subject === 'Verbal').length,
          Reasoning: allTestsData.filter((t: any) => t.testType === 'Practice' && t.subject === 'Reasoning').length,
          Technical: allTestsData.filter((t: any) => t.testType === 'Practice' && t.subject === 'Technical').length,
          Arithmetic: allTestsData.filter((t: any) => t.testType === 'Practice' && t.subject === 'Arithmetic').length,
          Communication: allTestsData.filter((t: any) => t.testType === 'Practice' && t.subject === 'Communication').length
        },
        mockTest: {
          all: allTestsData.filter((t: any) => t.testType === 'Mock Test').length,
          Verbal: allTestsData.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Verbal').length,
          Reasoning: allTestsData.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Reasoning').length,
          Technical: allTestsData.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Technical').length,
          Arithmetic: allTestsData.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Arithmetic').length,
          Communication: allTestsData.filter((t: any) => t.testType === 'Mock Test' && t.subject === 'Communication').length
        },
        company: {
          all: allTestsData.filter((t: any) => t.testType === 'Specific Company Test').length,
          Verbal: allTestsData.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Verbal').length,
          Reasoning: allTestsData.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Reasoning').length,
          Technical: allTestsData.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Technical').length,
          Arithmetic: allTestsData.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Arithmetic').length,
          Communication: allTestsData.filter((t: any) => t.testType === 'Specific Company Test' && t.subject === 'Communication').length
        }
      };
      setCategorizedCounts(categorizedCounts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setFormLoading(true);
      await apiService.createUser(userData);

      // Reload data
      await loadDashboardData();
      if (userData.role === 'faculty') {
        await loadFaculty();
      } else {
        await loadStudents();
      }

      // Close modal after successful creation and data reload
      setShowUserForm(false);
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkUpload = async (file: File, role: string) => {
    try {
      setFormLoading(true);
      const result = await apiService.bulkUploadUsers(file, role);

      // Reload data
      await loadDashboardData();
      if (role === 'faculty') {
        await loadFaculty();
      } else {
        await loadStudents();
      }

      // Modal close is handled by BulkUploadForm after showing results
      return result;
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };
  const handleTestAssignmentStatus = async (assignmentId: string, status: 'accepted' | 'rejected', testType?: string) => {
    try {
      await apiService.updateTestAssignmentStatus(assignmentId, status);

      // If accepting a test, switch to that test type tab to show it immediately
      if (status === 'accepted' && testType) {
        setActiveTestType(testType);
        setActiveSubject('all');
        await loadAssignedTests(testType, 'all');
      } else {
        // Just reload with current filters
        await loadAssignedTests();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update test status');
    }
  };

  const handleAssignToStudents = async (assignmentId: string, filters: any) => {
    try {
      await apiService.assignTestToStudents(assignmentId, filters);
      setShowStudentAssignment(false);
      setSelectedAssignment(null);
      // Reload tests with current filters
      await loadAssignedTests();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign test to students');
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

  const toggleUserStatus = async (userId: string, currentRole: string) => {
    try {
      await apiService.toggleUserStatus(userId);

      // Reload data
      loadDashboardData();
      if (currentRole === 'faculty') {
        loadFaculty();
      } else {
        loadStudents();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return;

    try {
      setFormLoading(true);
      await apiService.updateUser(selectedUser._id, userData);
      setShowEditForm(false);
      setSelectedUser(null);

      // Reload data
      loadDashboardData();
      if (selectedUser.role === 'faculty') {
        loadFaculty();
      } else {
        loadStudents();
      }
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string, currentRole: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(userId);

      // Reload data
      loadDashboardData();
      if (currentRole === 'faculty') {
        loadFaculty();
      } else {
        loadStudents();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openUserForm = (role: 'faculty' | 'student') => {
    setDefaultRole(role);
    setShowUserForm(true);
  };

  const openBulkUpload = (role: 'faculty' | 'student') => {
    setDefaultRole(role);
    setShowBulkUpload(true);
  };
  if (loading && !dashboardData) {
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
          onClick={() => {
            setError(null);
            loadDashboardData();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activeTab === 'assigned-tests') {
    if (showTestReport && selectedTestId) {
      return (
        <CollegeTestReport
          testId={selectedTestId}
          onBack={() => {
            setShowTestReport(false);
            setSelectedTestId(null);
          }}
        />
      );
    }

    const handleFilterChange = (testType: string, subject: string) => {
      setActiveTestType(testType);
      setActiveSubject(subject);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Assigned Tests</h2>
        </div>

        <CategorizedTestTabs
          onFilterChange={handleFilterChange}
          testCounts={categorizedCounts}
          loading={loading}
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(allTests) && allTests.length > 0 ? allTests.map((test) => (
                  <tr key={test._id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {test.testName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.assignmentStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                            test.assignmentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            test.assignmentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {test.assignmentStatus === 'not_assigned' ? 'Not Assigned' : test.assignmentStatus}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {test.testType && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {test.testType}
                            </span>
                          )}
                          {test.subject && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                              {test.subject}
                            </span>
                          )}
                          {test.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              test.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              test.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {test.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.assignedAt ? formatDate(test.assignedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs text-gray-500">
                        {test.testBatches ? test.testBatches.join(', ') : 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs text-gray-500">
                        {test.testBranches ? test.testBranches.join(', ') : 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs">
                        <span className="font-medium">{test.attemptCount || 0}</span>
                        <span className="text-gray-500"> / {test.assignedStudentCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">

                      <div className="flex gap-2">
                        {test.assignmentStatus === 'pending' && test.assignmentId && (
                          <>
                            <button
                              onClick={() => handleTestAssignmentStatus(test.assignmentId!, 'accepted', test.testType)}
                              className="bg-green-600 text-white py-1.5 px-3 rounded hover:bg-green-700 text-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleTestAssignmentStatus(test.assignmentId!, 'rejected')}
                              className="bg-red-600 text-white py-1.5 px-3 rounded hover:bg-red-700 text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {test.assignmentStatus === 'accepted' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setShowStudentAssignment(true);
                              }}
                              className="bg-blue-600 text-white py-1.5 px-3 rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
                              title="Assign to Students"
                            >
                              <Send size={14} />
                              Assign
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTestId(test._id);
                                setShowTestReport(true);
                              }}
                              className="bg-purple-600 text-white py-1.5 px-3 rounded hover:bg-purple-700 flex items-center gap-1 text-xs"
                              title="View Report"
                            >
                              <Eye size={14} />
                              Report
                            </button>
                          </>
                        )}
                        {test.assignmentStatus === 'not_assigned' && (
                          <span className="text-xs text-gray-500 italic">Not assigned</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                      <p className="text-gray-600">Tests created by Master Admin will appear here</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Assignment Modal */}
        {selectedTest && (
          <Modal
            isOpen={showStudentAssignment}
            onClose={() => {
              setShowStudentAssignment(false);
              setSelectedTest(null);
            }}
            title="Assign Test to Students"
            size="lg"
          >
            <StudentAssignmentForm
              test={selectedTest}
              students={students}
              onAssign={handleAssignToStudents}
              onClose={() => {
                setShowStudentAssignment(false);
                setSelectedTest(null);
              }}
            />
          </Modal>
        )}
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return <NotificationsPage />;
  }

  const renderUserTable = (users: User[], userType: string) => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">{userType}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => openBulkUpload(userType.toLowerCase().slice(0, -1) as 'faculty' | 'student')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Upload size={16} />
            Bulk Upload
          </button>
          <button
            onClick={() => openUserForm(userType.toLowerCase().slice(0, -1) as 'faculty' | 'student')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add {userType.slice(0, -1)}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(users) && users.length > 0 ? users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.idNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.branch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.batch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.hasLoggedIn ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm text-gray-500">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Recently'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} className="text-orange-500" />
                        <span className="text-sm text-gray-500">Never</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id, user.name, user.role)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>

      {(!Array.isArray(users) || users.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <p>No {userType.toLowerCase()} found</p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => openBulkUpload(userType.toLowerCase().slice(0, -1) as 'faculty' | 'student')}
              className="text-green-600 hover:text-green-800"
            >
              Bulk upload {userType.toLowerCase()}
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={() => openUserForm(userType.toLowerCase().slice(0, -1) as 'faculty' | 'student')}
              className="text-blue-600 hover:text-blue-800"
            >
              Add manually
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (activeTab === 'faculty') {
    return (
      <div className="space-y-6">
        {renderUserTable(faculty, 'Faculty')}

        <Modal
          isOpen={showUserForm}
          onClose={() => setShowUserForm(false)}
          title="Create New Faculty"
          size="lg"
        >
          <UserForm
            onSubmit={handleCreateUser}
            loading={formLoading}
            defaultRole="faculty"
          />
        </Modal>

        <Modal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          title="Bulk Upload Faculty"
          size="lg"
        >
          <BulkUploadForm
            role="faculty"
            onSubmit={handleBulkUpload}
            loading={formLoading}
            onClose={() => setShowBulkUpload(false)}
          />
        </Modal>

        <Modal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedUser(null);
          }}
          title="Edit Faculty"
          size="lg"
        >
          {selectedUser && (
            <UserForm
              onSubmit={handleUpdateUser}
              loading={formLoading}
              defaultRole="faculty"
              initialData={{
                name: selectedUser.name,
                email: selectedUser.email,
                role: 'faculty',
                idNumber: selectedUser.idNumber,
                branch: selectedUser.branch,
                batch: selectedUser.batch,
                section: selectedUser.section,
                phoneNumber: selectedUser.phoneNumber || ''
              }}
            />
          )}
        </Modal>
      </div>
    );
  }
         

  if (activeTab === 'students') {
    return (
      <>
        <div className="space-y-6">
          {renderUserTable(students, 'Students')}

          <Modal
            isOpen={showUserForm}
            onClose={() => setShowUserForm(false)}
            title="Create New Student"
            size="lg"
          >
            <UserForm
              onSubmit={handleCreateUser}
              loading={formLoading}
              defaultRole="student"
            />
          </Modal>

          <Modal
            isOpen={showBulkUpload}
            onClose={() => setShowBulkUpload(false)}
            title="Bulk Upload Students"
            size="lg"
          >
            <BulkUploadForm
              role="student"
              onSubmit={handleBulkUpload}
              loading={formLoading}
              onClose={() => setShowBulkUpload(false)}
            />
          </Modal>

          <Modal
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setSelectedUser(null);
            }}
            title="Edit Student"
            size="lg"
          >
            {selectedUser && (
              <UserForm
                onSubmit={handleUpdateUser}
                loading={formLoading}
                defaultRole="student"
                initialData={{
                  name: selectedUser.name,
                  email: selectedUser.email,
                  role: 'student',
                  idNumber: selectedUser.idNumber,
                  branch: selectedUser.branch,
                  batch: selectedUser.batch,
                  section: selectedUser.section,
                  phoneNumber: selectedUser.phoneNumber || ''
                }}
              />
            )}
          </Modal>
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
      </>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-6">
      {dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-gray-700" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faculty</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalFaculty}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-gray-700" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-gray-700" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.loginStats.hasLoggedIn}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-700" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.loginStats.neverLoggedIn}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">Quick Actions</h3>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Bell size={16} />
                  Send Notification
                </button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openUserForm('faculty')}
                    className="bg-white border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add Faculty
                  </button>
                  <button
                    onClick={() => openBulkUpload('faculty')}
                    className="bg-white border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 text-sm font-medium"
                  >
                    <Upload size={16} />
                    Bulk Faculty
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openUserForm('student')}
                    className="bg-white border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add Student
                  </button>
                  <button
                    onClick={() => openBulkUpload('student')}
                    className="bg-white border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 text-sm font-medium"
                  >
                    <Upload size={16} />
                    Bulk Students
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">Recent Additions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Array.isArray(dashboardData.recentUsers) && dashboardData.recentUsers.length > 0 ? dashboardData.recentUsers.slice(0, 5).map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.role} - {user.branch}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {user.hasLoggedIn ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Clock size={16} className="text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Added {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No recent users</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        title={`Create New ${defaultRole === 'faculty' ? 'Faculty' : 'Student'}`}
        size="lg"
      >
        <UserForm 
          onSubmit={handleCreateUser} 
          loading={formLoading}
          defaultRole={defaultRole}
        />
      </Modal>
   
      <Modal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title={`Bulk Upload ${defaultRole === 'faculty' ? 'Faculty' : 'Students'}`}
        size="lg"
      >
        <BulkUploadForm 
          role={defaultRole}
          onSubmit={handleBulkUpload} 
          loading={formLoading}
          onClose={() => setShowBulkUpload(false)}
        />
      </Modal>
       </div>
  );
};

// Student Assignment Form Component
interface StudentAssignmentFormProps {
  test: TestWithStatus;
  students: User[];
  onAssign: (assignmentId: string, filters: any) => Promise<void>;
  onClose: () => void;
}

const StudentAssignmentForm: React.FC<StudentAssignmentFormProps> = ({
  test,
  students,
  onAssign,
  onClose
}) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (selectedBranch || selectedBatch || selectedSection || searchTerm) {
      loadStudents();
    }
  }, [selectedBranch, selectedBatch, selectedSection, searchTerm]);

  const loadFilters = async () => {
    try {
      setLoading(true);
      const [branchesData, batchesData, sectionsData] = await Promise.all([
        apiService.getBranches(),
        apiService.getBatches(),
        apiService.getSections()
      ]);
      setBranches(branchesData);
      setBatches(batchesData);
      setSections(sectionsData);
    } catch (error) {
      console.error('Failed to load filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await apiService.getStudents(
        selectedBranch || undefined,
        selectedBatch || undefined,
        selectedSection || undefined,
        searchTerm || undefined
      );
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
      setFilteredStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    if (!test.assignmentId) {
      alert('Assignment ID not found');
      return;
    }

    try {
      setAssigning(true);
      await onAssign(test.assignmentId, {
        branches: selectedBranch ? [selectedBranch] : [],
        batches: selectedBatch ? [selectedBatch] : [],
        sections: selectedSection ? [selectedSection] : [],
        specificStudents: selectedStudents
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Assign Test: {test.testName}
        </h3>
        <p className="text-sm text-gray-600">
          Select filters and then choose specific students to assign the test
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Batches</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Students
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or ID..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Students ({selectedStudents.length} selected)
          </label>
          {filteredStudents.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students found. Please adjust your filters.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map(student => (
                <label key={student._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => handleStudentToggle(student._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">
                      {student.idNumber} | {student.branch} - {student.batch} - {student.section}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          disabled={assigning}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={assigning || selectedStudents.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {assigning ? (
            <>
              <LoadingSpinner size="sm" />
              Assigning...
            </>
          ) : (
            <>
              <Send size={16} />
              Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CollegeAdminDashboard;
