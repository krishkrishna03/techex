import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, ChevronDown, GraduationCap, BookOpen, User, Mail, Phone, Hash, Calendar, CheckCircle, Clock, CreditCard as Edit, Trash2 } from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import Modal from '../UI/Modal';
import UserForm from '../Forms/UserForm';

interface Student {
  _id: string;
  name: string;
  email: string;
  idNumber: string;
  branch: string;
  batch: string;
  section: string;
  phoneNumber?: string;
  hasLoggedIn: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface HierarchyData {
  [batch: string]: {
    [branch: string]: {
      [section: string]: Student[];
    };
  };
}

interface Summary {
  totalStudents: number;
  totalBatches: number;
  totalBranches: number;
  totalSections: number;
}

const StudentHierarchy: React.FC = () => {
  const [hierarchyData, setHierarchyData] = useState<HierarchyData>({});
  const [summary, setSummary] = useState<Summary>({
    totalStudents: 0,
    totalBatches: 0,
    totalBranches: 0,
    totalSections: 0
  });
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCollegeHierarchy();
      setHierarchyData(data.hierarchy);
      setSummary(data.summary);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load hierarchy data');
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = (batch: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batch)) {
      newExpanded.delete(batch);
    } else {
      newExpanded.add(batch);
    }
    setExpandedBatches(newExpanded);
  };

  const toggleBranch = (batchBranch: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(batchBranch)) {
      newExpanded.delete(batchBranch);
    } else {
      newExpanded.add(batchBranch);
    }
    setExpandedBranches(newExpanded);
  };

  const toggleSection = (batchBranchSection: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(batchBranchSection)) {
      newExpanded.delete(batchBranchSection);
    } else {
      newExpanded.add(batchBranchSection);
    }
    setExpandedSections(newExpanded);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditForm(true);
  };

  const handleUpdateStudent = async (userData: any) => {
    if (!selectedStudent) return;
    
    try {
      setFormLoading(true);
      await apiService.updateUser(selectedStudent._id, userData);
      setShowEditForm(false);
      setSelectedStudent(null);
      loadHierarchyData();
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: string) => {
    try {
      await apiService.toggleUserStatus(studentId);
      loadHierarchyData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update student status');
    }
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
          onClick={loadHierarchyData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Hierarchy</h2>
        <p className="text-gray-600">Manage students organized by batch, branch, and section</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Batches</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBatches}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Branches</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBranches}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sections</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSections}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Student Organization</h3>
        </div>
        <div className="p-6">
          {Object.keys(hierarchyData).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(hierarchyData).map(([batch, branches]) => (
                <div key={batch} className="border rounded-lg">
                  {/* Batch Level */}
                  <div
                    onClick={() => toggleBatch(batch)}
                    className="flex items-center justify-between p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedBatches.has(batch) ? (
                        <ChevronDown size={20} className="text-blue-600" />
                      ) : (
                        <ChevronRight size={20} className="text-blue-600" />
                      )}
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Batch {batch}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{Object.keys(branches).length} branch{Object.keys(branches).length !== 1 ? 'es' : ''}</span>
                      <span>
                        {Object.values(branches).reduce((total, branchData) => 
                          total + Object.values(branchData).reduce((sectionTotal, students) => 
                            sectionTotal + students.length, 0), 0
                        )} students
                      </span>
                    </div>
                  </div>

                  {/* Branch Level */}
                  {expandedBatches.has(batch) && (
                    <div className="border-t">
                      {Object.entries(branches).map(([branch, sections]) => {
                        const batchBranch = `${batch}-${branch}`;
                        return (
                          <div key={batchBranch} className="border-b last:border-b-0">
                            <div
                              onClick={() => toggleBranch(batchBranch)}
                              className="flex items-center justify-between p-4 pl-8 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {expandedBranches.has(batchBranch) ? (
                                  <ChevronDown size={18} className="text-green-600" />
                                ) : (
                                  <ChevronRight size={18} className="text-green-600" />
                                )}
                                <BookOpen className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-gray-900">{branch}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{Object.keys(sections).length} section{Object.keys(sections).length !== 1 ? 's' : ''}</span>
                                <span>
                                  {Object.values(sections).reduce((total, students) => total + students.length, 0)} students
                                </span>
                              </div>
                            </div>

                            {/* Section Level */}
                            {expandedBranches.has(batchBranch) && (
                              <div className="border-t">
                                {Object.entries(sections).map(([section, students]) => {
                                  const batchBranchSection = `${batch}-${branch}-${section}`;
                                  return (
                                    <div key={batchBranchSection}>
                                      <div
                                        onClick={() => toggleSection(batchBranchSection)}
                                        className="flex items-center justify-between p-4 pl-12 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          {expandedSections.has(batchBranchSection) ? (
                                            <ChevronDown size={16} className="text-purple-600" />
                                          ) : (
                                            <ChevronRight size={16} className="text-purple-600" />
                                          )}
                                          <Users className="h-4 w-4 text-purple-600" />
                                          <span className="font-medium text-gray-900">Section {section}</span>
                                        </div>
                                        <span className="text-sm text-gray-600">{students.length} students</span>
                                      </div>

                                      {/* Students List */}
                                      {expandedSections.has(batchBranchSection) && (
                                        <div className="bg-gray-50 border-t">
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                              <thead className="bg-gray-100">
                                                <tr>
                                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student
                                                  </th>
                                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Roll Number
                                                  </th>
                                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
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
                                                {students.map((student) => (
                                                  <tr key={student._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                      <div className="flex items-center">
                                                        <User className="h-8 w-8 text-gray-400" />
                                                        <div className="ml-4">
                                                          <div className="text-sm font-medium text-gray-900">
                                                            {student.name}
                                                          </div>
                                                          <div className="text-sm text-gray-500">
                                                            {student.email}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                      {student.idNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                      {student.phoneNumber || 'Not provided'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                      <div className="flex items-center gap-2">
                                                        {student.hasLoggedIn ? (
                                                          <>
                                                            <CheckCircle size={16} className="text-green-500" />
                                                            <span className="text-sm text-gray-500">
                                                              {student.lastLogin ? formatDate(student.lastLogin) : 'Recently'}
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
                                                          onClick={() => handleEditStudent(student)}
                                                          className="text-blue-600 hover:text-blue-900"
                                                        >
                                                          <Edit size={16} />
                                                        </button>
                                                        <button
                                                          onClick={() => handleToggleStatus(student._id)}
                                                          className="text-red-600 hover:text-red-900"
                                                        >
                                                          <Trash2 size={16} />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedStudent(null);
        }}
        title="Edit Student"
        size="lg"
      >
        {selectedStudent && (
          <UserForm 
            onSubmit={handleUpdateStudent} 
            loading={formLoading}
            defaultRole="student"
            initialData={{
              name: selectedStudent.name,
              email: selectedStudent.email,
              role: 'student',
              idNumber: selectedStudent.idNumber,
              branch: selectedStudent.branch,
              batch: selectedStudent.batch,
              section: selectedStudent.section,
              phoneNumber: selectedStudent.phoneNumber || ''
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentHierarchy;