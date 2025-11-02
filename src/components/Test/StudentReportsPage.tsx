import React, { useState, useEffect } from 'react';
import { FileText, Award, Clock, CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiService from '../../services/api';
import CategorizedTestTabs from './CategorizedTestTabs';
import LoadingSpinner from '../UI/LoadingSpinner';

interface TestReport {
  _id: string;
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
  startTime: string;
  endTime: string;
}

const StudentReportsPage: React.FC = () => {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<TestReport[]>([]);
  const [testCounts, setTestCounts] = useState<any>(null);
  const [activeTestType, setActiveTestType] = useState('all');
  const [activeSubject, setActiveSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (testType?: string, subject?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getStudentTestReports(
        testType === 'all' ? undefined : testType,
        subject === 'all' ? undefined : subject
      );

      setReports(data);
      setFilteredReports(data);

      const allReports = await apiService.getStudentTestReports();

      const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];

      const counts = {
        assessment: {} as { [key: string]: number },
        practice: {} as { [key: string]: number },
        mockTest: {} as { [key: string]: number },
        company: {} as { [key: string]: number }
      };

      subjects.forEach(sub => {
        counts.assessment[sub] = allReports.filter((r: TestReport) =>
          r.testType === 'Assessment' && r.subject === sub
        ).length;

        counts.practice[sub] = allReports.filter((r: TestReport) =>
          r.testType === 'Practice' && r.subject === sub
        ).length;

        counts.mockTest[sub] = allReports.filter((r: TestReport) =>
          r.testType === 'Mock Test' && r.subject === sub
        ).length;

        counts.company[sub] = allReports.filter((r: TestReport) =>
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
    const passedTests = filteredReports.filter(r => r.status === 'Pass').length;
    const avgPercentage = filteredReports.reduce((sum, r) => sum + r.percentage, 0) / totalTests;
    const totalTimeSpent = filteredReports.reduce((sum, r) => sum + r.timeSpent, 0);

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      avgPercentage: avgPercentage.toFixed(1),
      totalTimeSpent: Math.round(totalTimeSpent)
    };
  };

  const getChartData = () => {
    const subjectData: { [key: string]: { total: number, correct: number, incorrect: number } } = {};

    filteredReports.forEach(report => {
      if (!subjectData[report.subject]) {
        subjectData[report.subject] = { total: 0, correct: 0, incorrect: 0 };
      }
      subjectData[report.subject].total++;
      subjectData[report.subject].correct += report.correctAnswers;
      subjectData[report.subject].incorrect += report.incorrectAnswers;
    });

    return Object.keys(subjectData).map(subject => ({
      subject,
      tests: subjectData[subject].total,
      correct: subjectData[subject].correct,
      incorrect: subjectData[subject].incorrect,
      avgScore: ((subjectData[subject].correct / (subjectData[subject].correct + subjectData[subject].incorrect)) * 100).toFixed(1)
    }));
  };

  const getPieData = () => {
    const stats = calculateStats();
    if (!stats) return [];

    return [
      { name: 'Passed', value: stats.passedTests, color: '#10b981' },
      { name: 'Failed', value: stats.failedTests, color: '#ef4444' }
    ];
  };

  const stats = calculateStats();
  const chartData = getChartData();
  const pieData = getPieData();

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
          <h2 className="text-2xl font-bold text-gray-900">My Test Reports</h2>
          <p className="text-gray-600 mt-1">View your test performance and scores</p>
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

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Passed</p>
                <p className="text-2xl font-bold text-green-700">{stats.passedTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
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

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Time Spent</p>
                <p className="text-2xl font-bold text-gray-700">{stats.totalTimeSpent}m</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#10b981" name="Correct" />
                <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass/Fail Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
            Complete some tests to see your performance reports here.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentReportsPage;
