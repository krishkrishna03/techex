import React, { useState, useEffect } from 'react';
import { Eye, Users, CheckCircle, XCircle, Clock, Mail, Search } from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface NotificationTrackingProps {
  onClose?: () => void;
}

const NotificationTracking: React.FC<NotificationTrackingProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  useEffect(() => {
    if (selectedNotification) {
      fetchRecipients(selectedNotification.id);
    }
  }, [selectedNotification, recipientFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSentNotifications(currentPage, 20);
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async (notificationId: string) => {
    try {
      setRecipientsLoading(true);
      const filter = recipientFilter === 'all' ? undefined : recipientFilter;
      const data = await apiService.getNotificationRecipients(notificationId, 1, 50, filter);
      setRecipients(data.recipients);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return '🚨';
      case 'announcement':
        return '📣';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Notification Tracking</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {selectedNotification ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedNotification(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to All Notifications
          </button>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getTypeIcon(selectedNotification.type)} {selectedNotification.title}
                </h3>
                <p className="text-gray-600">{selectedNotification.message}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedNotification.priority)}`}>
                {selectedNotification.priority.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Users className="text-blue-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-blue-900">{selectedNotification.totalRecipients}</p>
                <p className="text-sm text-blue-700">Total Recipients</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <CheckCircle className="text-green-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-green-900">{selectedNotification.totalRead}</p>
                <p className="text-sm text-green-700">Read</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <XCircle className="text-orange-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-orange-900">{selectedNotification.totalUnread}</p>
                <p className="text-sm text-orange-700">Unread</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Mail className="text-purple-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-purple-900">{selectedNotification.emailsSent}</p>
                <p className="text-sm text-purple-700">Emails Sent</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Read Rate</span>
                <span className="text-sm font-bold text-gray-900">
                  {selectedNotification.readPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${selectedNotification.readPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setRecipientFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  recipientFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Recipients
              </button>
              <button
                onClick={() => setRecipientFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  recipientFilter === 'read'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read Only
              </button>
              <button
                onClick={() => setRecipientFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  recipientFilter === 'unread'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread Only
              </button>
            </div>

            {recipientsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recipients.map((recipient) => (
                      <tr key={recipient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {recipient.user?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {recipient.user?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                          {recipient.user?.role?.replace('_', ' ') || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {recipient.isRead ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={14} className="mr-1" />
                              Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock size={14} className="mr-1" />
                              Unread
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {recipient.readAt
                            ? new Date(recipient.readAt).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => setSelectedNotification(notification)}
              className="bg-white rounded-lg border p-4 hover:shadow-lg cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTypeIcon(notification.type)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{notification.message}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users size={16} />
                      <span>{notification.totalRecipients} recipients</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span>{notification.totalRead} read</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600">
                      <XCircle size={16} />
                      <span>{notification.totalUnread} unread</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <Mail size={16} />
                      <span>{notification.emailsSent} emails sent</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {notification.readPercentage.toFixed(1)}% Read Rate
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pagination && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationTracking;
