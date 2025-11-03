import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, GraduationCap, Calculator, MessageSquare, Brain, Building, Eye, Send, CreditCard as Edit, Trash2, Plus } from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import Modal from '../UI/Modal';
import TestFormWithSections from '../Test/TestFormWithSections';
import TestAssignmentModal from '../Test/TestAssignmentModal';

interface ExamManagementProps {
  userRole: string;
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType: string;
  companyName?: string;
  difficulty?: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

const ExamManagement: React.FC<ExamManagementProps> = ({ userRole }) => {
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [testCounts, setTestCounts] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const testTypes = [
    { id: 'Assessment', label: 'Assessment', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { id: 'Practice', label: 'Practice', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    { id: 'Assignment', label: 'Assignment', icon: GraduationCap, color: 'bg-purple-100 text-purple-800' },
    { id: 'Mock Test', label: 'Mock Test', icon: Brain, color: 'bg-orange-100 text-orange-800' },
    { id: 'Specific Company Test', label: 'Company Test', icon: Building, color: 'bg-red-100 text-red-800' }
  ];

  const subjects = [
    { id: 'Verbal', label: 'Verbal', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
    { id: 'Reasoning', label: 'Reasoning', icon: Brain, color: 'bg-green-100 text-green-800' },
    { id: 'Technical', label: 'Technical', icon: FileText, color: 'bg-purple-100 text-purple-800' },
    { id: 'Arithmetic', label: 'Arithmetic', icon: Calculator, color: 'bg-orange-100 text-orange-800' },
    { id: 'Communication', label: 'Communication', icon: MessageSquare, color: 'bg-pink-100 text-pink-800' }
  ];

  useEffect(() => {
    loadTestCounts();
  }, []);

  useEffect(() => {
    if (selectedTestType && selectedSubject) {
      loadTests();
    }
  }, [selectedTestType, selectedSubject]);

  const loadTestCounts = async () => {
    try {
      let allTests = [];
      
      if (userRole === 'master_admin') {
        allTests = await apiService.getTests();
      } else if (userRole === 'college_admin') {
        allTests = await apiService.getAssignedTests();
      } else if (userRole === 'student') {
        allTests = await apiService.getStudentAssignedTests();
      }

      // Calculate counts by type and subject
      const counts = {
        byType: {},
        bySubject: {}
      };

      testTypes.forEach(type => {
        counts.byType[type.id] = allTests.filter((t: any) => 
          (t.testId?.testType || t.testType) === type.id
        ).length;
      });

      subjects.forEach(subject => {
        counts.bySubject[subject.id] = allTests.filter((t: any) => 
          (t.testId?.subject || t.subject) === subject.id
        ).length;
      });

      setTestCounts(counts);
    } catch (error) {
      console.error('Failed to load test counts:', error);
    }
  };

  const loadTests = async () => {
    try {
      setLoading(true);
      let testsData = [];
      
      if (userRole === 'master_admin') {
        testsData = await apiService.getTests(selectedTestType, selectedSubject);
      } else if (userRole === 'college_admin') {
        const assignedTests = await apiService.getAssignedTests(selectedTestType, selectedSubject);
        testsData = assignedTests.map((assignment: any) => assignment.testId);
      } else if (userRole === 'student') {
        const assignedTests = await apiService.getStudentAssignedTests(selectedTestType, selectedSubject);
        testsData = assignedTests.map((assignment: any) => assignment.testId);
      }
      
      setTests(testsData);
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (testData: any) => {
    try {
      setFormLoading(true);

      // Convert datetime-local values to ISO strings with proper timezone
      const formattedTestData = {
        ...testData,
        startDateTime: new Date(testData.startDateTime).toISOString(),
        endDateTime: new Date(testData.endDateTime).toISOString()
      };

      await apiService.createTest(formattedTestData);
      setShowTestForm(false);
      loadTestCounts();
      if (selectedTestType && selectedSubject) {
        loadTests();
      }
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTest = async (testData: any) => {
    if (!selectedTest) return;
    
    try {
      setFormLoading(true);
      await apiService.updateTest(selectedTest._id, testData);
      setShowEditForm(false);
      setSelectedTest(null);
      loadTests();
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteTest(testId);
      loadTestCounts();
      if (selectedTestType && selectedSubject) {
        loadTests();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete test');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date(test.endDateTime);
    
    if (now < start) return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    if (now > end) return { text: 'Ended', color: 'bg-red-100 text-red-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  // Step 1: Show Test Types
  if (!selectedTestType) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
            <p className="text-gray-600">Select a test type to view available exams</p>
          </div>
          {userRole === 'master_admin' && (
            <button
              onClick={() => setShowTestForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Test
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testTypes.map((type) => {
            const Icon = type.icon;
            const count = testCounts.byType?.[type.id] || 0;
            
            return (
              <div
                key={type.id}
                onClick={() => setSelectedTestType(type.id)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${type.color}`}>
                    {count} test{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.label}</h3>
                <p className="text-gray-600 text-sm">
                  {type.id === 'Assessment' && 'Formal evaluations and graded tests'}
                  {type.id === 'Practice' && 'Practice tests with instant feedback'}
                  {type.id === 'Assignment' && 'Course assignments and homework'}
                  {type.id === 'Mock Test' && 'Mock tests for exam preparation'}
                  {type.id === 'Specific Company Test' && 'Company-specific assessment tests'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Test Creation Modal */}
        <Modal
          isOpen={showTestForm}
          onClose={() => setShowTestForm(false)}
          title="Create New Test"
          size="xl"
        >
          <TestFormWithSections onSubmit={handleCreateTest} loading={formLoading} />
        </Modal>
      </div>
    );
  }

  // Step 2: Show Subjects for selected Test Type
  if (selectedTestType && !selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedTestType(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Test Types
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedTestType} Tests</h2>
            <p className="text-gray-600">Select a subject to view available tests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            const count = testCounts.bySubject?.[subject.id] || 0;
            
            return (
              <div
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-green-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${subject.color}`}>
                    {count} test{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject.label}</h3>
                <p className="text-gray-600 text-sm">
                  {subject.id === 'Verbal' && 'Language skills, vocabulary, and comprehension'}
                  {subject.id === 'Reasoning' && 'Logical thinking and problem-solving'}
                  {subject.id === 'Technical' && 'Programming and technical knowledge'}
                  {subject.id === 'Arithmetic' && 'Mathematical calculations and concepts'}
                  {subject.id === 'Communication' && 'Written and verbal communication skills'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 3: Show Tests for selected Type and Subject
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedSubject(null)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Subjects
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedSubject} - {selectedTestType} Tests
          </h2>
          <p className="text-gray-600">{tests.length} test{tests.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">
            No {selectedTestType.toLowerCase()} tests available for {selectedSubject}
          </p>
          {userRole === 'master_admin' && (
            <button
              onClick={() => setShowTestForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create First Test
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {tests.map((test) => {
            const status = getTestStatus(test);
            
            return (
              <div key={test._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{test.testName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      {test.difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          test.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.difficulty}
                        </span>
                      )}
                      {test.companyName && test.testType === 'Specific Company Test' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {test.companyName}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{test.testDescription}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Questions</p>
                    <p className="font-semibold">{test.numberOfQuestions}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Total Marks</p>
                    <p className="font-semibold">{test.totalMarks}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-semibold">{test.duration} min</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Created</p>
                    <p className="font-semibold text-xs">{formatDate(test.createdAt)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-3">
                    <p><strong>Start:</strong> {formatDate(test.startDateTime)}</p>
                    <p><strong>End:</strong> {formatDate(test.endDateTime)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTest(test);
                        // View test details
                      }}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    
                    {userRole === 'master_admin' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTest(test);
                            setShowEditForm(true);
                          }}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTest(test);
                            setShowAssignmentModal(true);
                          }}
                          className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                        >
                          <Send size={16} />
                          Assign
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test._id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showTestForm}
        onClose={() => setShowTestForm(false)}
        title="Create New Test"
        size="xl"
      >
        <TestFormWithSections onSubmit={handleCreateTest} loading={formLoading} />
      </Modal>

      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedTest(null);
        }}
        title="Edit Test"
        size="xl"
      >
        {selectedTest && (
          <TestFormWithSections
            onSubmit={handleEditTest}
            loading={formLoading}
            initialData={selectedTest}
          />
        )}
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
    </div>
  );
};

export default ExamManagement;