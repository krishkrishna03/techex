import React, { useState, useEffect } from 'react';
import { X, Users, Award, TrendingUp, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TestAnalyticsModalProps {
  testId: string;
  onClose: () => void;
}

interface TestReport {
  test: {
    _id: string;
    testName: string;
    testType: string;
    subject: string;
    totalMarks: number;
    numberOfQuestions: number;
    duration: number;
    difficulty?: string;
    companyName?: string;
  };
  analytics: {
    totalStudents: number;
    completed: number;
    pending: number;
    avgScore: string;
    passedCount: number;
    failedCount: number;
    passPercentage: string;
  };
  topStudents: Array<{
    name: string;
    email: string;
    percentage: number;
    marksObtained: number;
    totalMarks: number;
  }>;
  sectionStats: Array<{
    section: string;
    avgScore: string;
    students: number;
  }>;
  questionAnalysis: Array<{
    questionNumber: number;
    questionText: string;
    correctCount: number;
    incorrectCount: number;
    correctPercentage: string;
  }>;
  attempts: Array<{
    _id: string;
    studentName: string;
    studentEmail: string;
    batch?: string;
    branch?: string;
    section?: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number;
    completedAt: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TestAnalyticsModal: React.FC<TestAnalyticsModalProps> = ({ testId, onClose }) => {
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('overview');

  useEffect(() => {
    loadReport();
  }, [testId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFacultyTestReport(testId);
      setReport(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Failed to load report'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const sectionChartData = report.sectionStats.map(stat => ({
    name: stat.section,
    avgScore: parseFloat(stat.avgScore),
    students: stat.students
  }));

  const passFailData = [
    { name: 'Passed', value: report.analytics.passedCount },
    { name: 'Failed', value: report.analytics.failedCount }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{report.test.testName}</h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {report.test.subject}
              </span>
              <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                {report.test.testType}
              </span>
              {report.test.difficulty && (
                <span className="text-sm text-gray-600 bg-yellow-100 px-2 py-1 rounded">
                  {report.test.difficulty}
                </span>
              )}
              {report.test.companyName && (
                <span className="text-sm text-gray-600 bg-red-100 px-2 py-1 rounded">
                  {report.test.companyName}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Total Students</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{report.analytics.totalStudents}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-600">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{report.analytics.completed}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-600">Avg Score</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{report.analytics.avgScore}%</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <p className="text-sm font-medium text-indigo-600">Pass Rate</p>
              </div>
              <p className="text-2xl font-bold text-indigo-700">{report.analytics.passPercentage}%</p>
            </div>
          </div>

          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('overview')}
              className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
              {expandedSection === 'overview' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'overview' && (
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Pass/Fail Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={passFailData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {passFailData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {report.sectionStats.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Section-wise Performance</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sectionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {report.topStudents.length > 0 && (
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('topStudents')}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Students</h3>
                {expandedSection === 'topStudents' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'topStudents' && (
                <div className="p-6">
                  <div className="space-y-3">
                    {report.topStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{student.percentage.toFixed(1)}%</p>
                          <p className="text-sm text-gray-500">
                            {student.marksObtained} / {student.totalMarks}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {report.questionAnalysis.length > 0 && (
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('questionAnalysis')}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Question-wise Analysis</h3>
                {expandedSection === 'questionAnalysis' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSection === 'questionAnalysis' && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q. No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Correct</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Incorrect</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.questionAnalysis.map((qa) => (
                          <tr key={qa.questionNumber} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{qa.questionNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{qa.questionText}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {qa.correctCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {qa.incorrectCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-semibold text-gray-900">{qa.correctPercentage}%</span>
                                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${qa.correctPercentage}%` }}
                                  ></div>
                                </div>
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
          )}

          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('allStudents')}
              className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">All Student Results ({report.attempts.length})</h3>
              {expandedSection === 'allStudents' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'allStudents' && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Correct</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.attempts.map((attempt) => (
                        <tr key={attempt._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{attempt.studentName}</span>
                              <span className="text-xs text-gray-500">{attempt.studentEmail}</span>
                              {(attempt.batch || attempt.branch || attempt.section) && (
                                <div className="flex gap-1 mt-1">
                                  {attempt.batch && <span className="text-xs bg-gray-100 px-1 rounded">{attempt.batch}</span>}
                                  {attempt.branch && <span className="text-xs bg-gray-100 px-1 rounded">{attempt.branch}</span>}
                                  {attempt.section && <span className="text-xs bg-gray-100 px-1 rounded">{attempt.section}</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                            {attempt.marksObtained} / {attempt.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              attempt.percentage >= 80 ? 'bg-green-100 text-green-800' :
                              attempt.percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                              attempt.percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attempt.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {attempt.correctAnswers} / {attempt.correctAnswers + attempt.incorrectAnswers}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <Clock size={14} />
                              {attempt.timeSpent} min
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              attempt.percentage >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.percentage >= 40 ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAnalyticsModal;
