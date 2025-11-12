import React from 'react';
import { TrendingUp, TrendingDown, Award, Target, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TestResult {
  _id: string;
  testName: string;
  testType: string;
  subject: string;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  completedAt: string;
  status: string;
}

interface StudentPerformanceAnalyticsProps {
  testResults: TestResult[];
}

const StudentPerformanceAnalytics: React.FC<StudentPerformanceAnalyticsProps> = ({ testResults }) => {
  if (testResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Data Yet</h3>
        <p className="text-gray-600">Complete tests to see your performance analytics</p>
      </div>
    );
  }

  const totalTests = testResults.length;
  const averageScore = testResults.reduce((sum, test) => sum + test.percentage, 0) / totalTests;
  const totalTimeSpent = testResults.reduce((sum, test) => sum + test.timeSpent, 0);
  const passedTests = testResults.filter(test => test.percentage >= 40).length;
  const completionRate = (passedTests / totalTests) * 100;

  const topScore = Math.max(...testResults.map(t => t.percentage));
  const lowestScore = Math.min(...testResults.map(t => t.percentage));

  const trendData = testResults
    .slice()
    .reverse()
    .slice(-10)
    .map((test, index) => ({
      name: `Test ${index + 1}`,
      score: test.percentage,
      testName: test.testName.substring(0, 20)
    }));

  const subjectPerformance = testResults.reduce((acc: any, test) => {
    if (!acc[test.subject]) {
      acc[test.subject] = { subject: test.subject, total: 0, count: 0 };
    }
    acc[test.subject].total += test.percentage;
    acc[test.subject].count += 1;
    return acc;
  }, {});

  const subjectData = Object.values(subjectPerformance).map((item: any) => ({
    subject: item.subject,
    average: (item.total / item.count).toFixed(1)
  }));

  const typePerformance = testResults.reduce((acc: any, test) => {
    if (!acc[test.testType]) {
      acc[test.testType] = { type: test.testType, total: 0, count: 0 };
    }
    acc[test.testType].total += test.percentage;
    acc[test.testType].count += 1;
    return acc;
  }, {});

  const typeData = Object.values(typePerformance).map((item: any) => ({
    name: item.type,
    value: item.count
  }));

  const weakAreas = subjectData
    .sort((a: any, b: any) => parseFloat(a.average) - parseFloat(b.average))
    .slice(0, 3);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getPerformanceTrend = () => {
    if (trendData.length < 2) return 'neutral';
    const recent = trendData.slice(-3);
    const avgRecent = recent.reduce((sum, t) => sum + t.score, 0) / recent.length;
    const older = trendData.slice(-6, -3);
    const avgOlder = older.length > 0 ? older.reduce((sum, t) => sum + t.score, 0) / older.length : avgRecent;

    if (avgRecent > avgOlder + 5) return 'improving';
    if (avgRecent < avgOlder - 5) return 'declining';
    return 'stable';
  };

  const trend = getPerformanceTrend();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Average Score</h4>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-700">{averageScore.toFixed(1)}%</div>
          <div className="flex items-center gap-1 mt-1">
            {trend === 'improving' && (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Improving</span>
              </>
            )}
            {trend === 'declining' && (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Needs Focus</span>
              </>
            )}
            {trend === 'stable' && (
              <span className="text-xs text-gray-600">Stable performance</span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-900">Tests Taken</h4>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700">{totalTests}</div>
          <p className="text-xs text-green-600 mt-1">{passedTests} passed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-orange-900">Completion Rate</h4>
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-700">{completionRate.toFixed(0)}%</div>
          <p className="text-xs text-orange-600 mt-1">{passedTests}/{totalTests} tests passed</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Time Spent</h4>
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-gray-700">{totalTimeSpent}</div>
          <p className="text-xs text-gray-600 mt-1">minutes total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-medium">{payload[0].payload.testName}</p>
                        <p className="text-blue-600">{payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Award className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Best Score</p>
                <p className="text-2xl font-bold text-green-700">{topScore.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Lowest Score</p>
                <p className="text-2xl font-bold text-red-700">{lowestScore.toFixed(1)}%</p>
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900 mb-2">Areas to Improve</p>
              <div className="space-y-1">
                {weakAreas.map((area: any, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-orange-700">{area.subject}</span>
                    <span className="font-medium text-orange-900">{area.average}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {averageScore >= 75 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-600" />
            <div>
              <h4 className="font-semibold text-yellow-900">Top Performer!</h4>
              <p className="text-sm text-yellow-700">You're maintaining an excellent average score. Keep up the great work!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPerformanceAnalytics;
