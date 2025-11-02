import React, { useState, useEffect } from 'react';
import { Plus, Bell, Users, CheckCircle, Mail, TrendingUp, BarChart3, Download } from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsList from './NotificationsList';
import NotificationForm from './NotificationForm';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';

interface NotificationStats {
  totalNotifications: number;
  totalRecipients: number;
  totalRead: number;
  totalUnread: number;
  readPercentage: number;
  byRole: {
    colleges: number;
    faculty: number;
    students: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: Array<{
    _id: string;
    title: string;
    totalRecipients: number;
    emailsSent: number;
    createdAt: string;
  }>;
}

const NotificationsPage: React.FC = () => {
  const { state } = useAuth();
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (state.user?.role === 'master_admin' || state.user?.role === 'college_admin') {
      loadStats();
    }
  }, [state.user?.role, refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (formData: FormData) => {
    try {
      setFormLoading(true);
      await apiService.createNotificationWithFile(formData);
      setShowNotificationForm(false);
      setRefreshTrigger(prev => prev + 1);
      loadStats();
    } catch (error) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const exportReport = () => {
    if (!stats) return;

    const reportData = {
      'Report Generated': new Date().toLocaleString(),
      'Total Notifications Sent': stats.totalNotifications,
      'Total Recipients': stats.totalRecipients,
      'Read Notifications': stats.totalRead,
      'Unread Notifications': stats.totalUnread,
      'Read Percentage': `${stats.readPercentage.toFixed(2)}%`,
      'Sent to Colleges': stats.byRole.colleges,
      'Sent to Faculty': stats.byRole.faculty,
      'Sent to Students': stats.byRole.students,
      'High Priority': stats.byPriority.high,
      'Medium Priority': stats.byPriority.medium,
      'Low Priority': stats.byPriority.low,
    };

    const csv = Object.entries(reportData)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const isAdmin = state.user?.role === 'master_admin' || state.user?.role === 'college_admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">Manage and view all notifications</p>
        </div>

        {isAdmin && (
          <div className="flex gap-3">
            {stats && (
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={20} />
                Export Report
              </button>
            )}
            <button
              onClick={() => setShowNotificationForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Create Notification
            </button>
          </div>
        )}
      </div>

      {isAdmin && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Sent</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalNotifications}</p>
                </div>
                <Bell className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Recipients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRecipients}</p>
                </div>
                <Users className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Read Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.readPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.totalRead} of {stats.totalRecipients}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Emails Sent</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRecipients}</p>
                </div>
                <Mail className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribution by Role
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Colleges</span>
                    <span className="text-sm font-bold text-gray-900">{stats.byRole.colleges}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(stats.byRole.colleges / stats.totalRecipients) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Faculty</span>
                    <span className="text-sm font-bold text-gray-900">{stats.byRole.faculty}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(stats.byRole.faculty / stats.totalRecipients) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Students</span>
                    <span className="text-sm font-bold text-gray-900">{stats.byRole.students}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(stats.byRole.students / stats.totalRecipients) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Priority Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">High Priority</span>
                  <span className="text-lg font-bold text-red-600">{stats.byPriority.high}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Medium Priority</span>
                  <span className="text-lg font-bold text-yellow-600">{stats.byPriority.medium}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Low Priority</span>
                  <span className="text-lg font-bold text-green-600">{stats.byPriority.low}</span>
                </div>
              </div>
            </div>
          </div>

          {stats.recentActivity && stats.recentActivity.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emails Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentActivity.map((activity) => (
                      <tr key={activity._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.totalRecipients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.emailsSent || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <NotificationsList refreshTrigger={refreshTrigger} />

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

export default NotificationsPage;
