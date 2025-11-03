import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, EyeOff, TrendingUp, Send, Users, Calendar } from 'lucide-react';
import api from '../../services/api';

interface SeenByUser {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  seenAt: string;
}

interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  sentTo: string;
  createdAt: string;
  totalRecipients: number;
  seenCount: number;
  unseenCount: number;
  seenPercentage: number;
  seenBy: SeenByUser[];
}

interface DailyAnalytics {
  date: string;
  sent: number;
  seen: number;
}

interface AnalyticsData {
  summary: {
    totalNotificationsSent: number;
    totalRecipients: number;
    totalSeen: number;
    totalUnseen: number;
    overallSeenPercentage: number;
  };
  notifications: NotificationDetail[];
  dailyAnalytics: DailyAnalytics[];
}

const NotificationAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotificationAnalyticsReport(startDate, endDate);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchAnalytics();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotification(expandedNotification === notificationId ? null : notificationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  const pieChartData = [
    { name: 'Seen', value: analyticsData.summary.totalSeen },
    { name: 'Unseen', value: analyticsData.summary.totalUnseen }
  ];

  const formattedDailyData = analyticsData.dailyAnalytics.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: item.sent,
    seen: item.seen
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Analytics & Reports</h1>
          <p className="text-gray-600">Track and analyze notification engagement across your platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                fetchAnalytics();
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalNotificationsSent}</h3>
            <p className="text-gray-600">Total Notifications Sent</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalRecipients}</h3>
            <p className="text-gray-600">Total Recipients</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Eye className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalSeen}</h3>
            <p className="text-gray-600">Total Seen</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.summary.overallSeenPercentage}%</h3>
            <p className="text-gray-600">Engagement Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Engagement Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedDailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="seen" stroke="#10b981" strokeWidth={2} name="Seen" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Engagement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('table')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setSelectedView('chart')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'chart'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Chart View
              </button>
            </div>
          </div>

          {selectedView === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unseen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message.substring(0, 50)}...</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                          {notification.sentTo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {notification.totalRecipients}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            {notification.seenCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <EyeOff className="w-3 h-3 mr-1" />
                            {notification.unseenCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${notification.seenPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {notification.seenPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(notification.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpanded(notification.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {expandedNotification === notification.id ? 'Hide' : 'View'} Details
                          </button>
                        </td>
                      </tr>
                      {expandedNotification === notification.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Full Message:</h4>
                                <p className="text-gray-700">{notification.message}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Created By:</h4>
                                <p className="text-gray-700">
                                  {notification.createdBy.name} ({notification.createdBy.email})
                                </p>
                              </div>
                              {notification.seenBy.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    Seen By ({notification.seenBy.length}):
                                  </h4>
                                  <div className="max-h-60 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Name
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Email
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Role
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Seen At
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {notification.seenBy.map((user, index) => (
                                          <tr key={index}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{user.userName}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{user.userEmail}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                                              {user.userRole.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                              {formatDate(user.seenAt)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {analyticsData.notifications.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications found for the selected date range</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.notifications.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="title"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="seenCount" fill="#10b981" name="Seen" />
                  <Bar dataKey="unseenCount" fill="#ef4444" name="Unseen" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 text-center mt-4">
                Showing top 10 notifications by date
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationAnalytics;
