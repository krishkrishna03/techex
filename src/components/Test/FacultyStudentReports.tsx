import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, Clock, Award, TrendingUp } from 'lucide-react';
import apiService from '../../services/api';
import CategorizedTestTabs from './CategorizedTestTabs';
import LoadingSpinner from '../UI/LoadingSpinner';

interface StudentReport {
  _id: string;
  studentName: string;
  studentEmail: string;
  batch?: string;
  branch?: string;
  section?: string;
  testName: string;
  testType: string;
  subject: string;
  companyName?: string;
  difficulty?: string;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  status: string;
  completedAt: string;
}

const FacultyStudentReports: React.FC = () => {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<StudentReport[]>([]);
  const [testCounts, setTestCounts] = useState<any>(null);
  const [activeTestType, setActiveTestType] = useState('all');
  const [activeSubject, setActiveSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, selectedBatch, selectedBranch, selectedSection]);

  const loadReports = async (testType?: string, subject?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getFacultyStudentReports(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );

      setReports(data);

      const uniqueBatches = [...new Set(data.map((r: StudentReport) => r.batch).filter(Boolean))];
      const uniqueBranches = [...new Set(data.map((r: StudentReport) => r.branch).filter(Boolean))];
      const uniqueSections = [...new Set(data.map((r: StudentReport) => r.section).filter(Boolean))];

      setBatches(uniqueBatches as string[]);
      setBranches(uniqueBranches as string[]);
      setSections(uniqueSections as string[]);

      const allReports = await apiService.getFacultyStudentReports();

      const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];

      const counts = {
        assessment: {} as { [key: string]: number },
        practice: {} as { [key: string]: number },
        mockTest: {} as { [key: string]: number },
        company: {} as { [key: string]: number }
      };

      subjects.forEach(sub => {
        counts.assessment[sub] = allReports.filter((r: StudentReport) =>
          r.testType === 'Assessment' && r.subject === sub
        ).length;

        counts.practice[sub] = allReports.filter((r: StudentReport) =>
          r.testType === 'Practice' && r.subject === sub
        ).length;

        counts.mockTest[sub] = allReports.filter((r: StudentReport) =>
          r.testType === 'Mock Test' && r.subject === sub
        ).length;

        counts.company[sub] = allReports.filter((r: StudentReport) =>
          r.testType === 'Specific Company Test' && r.subject === sub
        ).length;
      });

      setTestCounts(counts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBatch !== 'all') {
      filtered = filtered.filter(r => r.batch === selectedBatch);
    }

    if (selectedBranch !== 'all') {
      filtered = filtered.filter(r => r.branch === selectedBranch);
    }

    if (selectedSection !== 'all') {
      filtered = filtered.filter(r => r.section === selectedSection);
    }

    setFilteredReports(filtered);
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
    return status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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

  const calculateStats = () => {
    if (filteredReports.length === 0) return null;

    const totalTests = filteredReports.length;
    const uniqueStudents = new Set(filteredReports.map(r => r.studentEmail)).size;
    const passedTests = filteredReports.filter(r => r.status === 'Pass').length;
    const avgPercentage = filteredReports.reduce((sum, r) => sum + r.percentage, 0) / totalTests;

    return {
      totalTests,
      uniqueStudents,
      passedTests,
      failedTests: totalTests - passedTests,
      avgPercentage: avgPercentage.toFixed(1)
    };
  };

  const stats = calculateStats();

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
          onClick={() => loadReports()}
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
          <h2 className="text-2xl font-bold text-gray-900">Student Test Reports</h2>
          <p className="text-gray-600 mt-1">View all students test performance and scores</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Students</p>
                <p className="text-2xl font-bold text-gray-700">{stats.uniqueStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Passed</p>
                <p className="text-2xl font-bold text-green-700">{stats.passedTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-700">{stats.failedTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Score</p>
                <p className="text-2xl font-bold text-orange-700">{stats.avgPercentage}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Batches</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      </div>

      <CategorizedTestTabs
        onFilterChange={(testType, subject) => {
          setActiveTestType(testType);
          setActiveSubject(subject);
          loadReports(testType, subject);
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
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{report.studentName}</div>
                      <div className="text-xs text-gray-500">{report.studentEmail}</div>
                      <div className="flex gap-1 mt-1">
                        {report.batch && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {report.batch}
                          </span>
                        )}
                        {report.branch && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {report.branch}
                          </span>
                        )}
                        {report.section && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {report.section}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{report.testName}</div>
                      {report.companyName && (
                        <div className="text-xs text-gray-500">Company: {report.companyName}</div>
                      )}
                      {report.difficulty && (
                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${getDifficultyColor(report.difficulty)}`}>
                          {report.difficulty}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTestTypeColor(report.testType)}`}>
                      {report.testType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.marksObtained} / {report.totalMarks}
                    </div>
                    <div className="text-xs text-gray-500">
                      {report.correctAnswers} correct, {report.incorrectAnswers} incorrect
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="text-sm font-bold text-gray-900">{report.percentage.toFixed(1)}%</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(report.completedAt)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock size={12} />
                      {report.timeSpent} min
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-200">
          <Award className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No test reports found</h3>
          <p className="text-gray-600">
            No student has completed any tests yet or no results match your filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default FacultyStudentReports;
