import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, AlertCircle, MessageSquare, Calendar } from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import NotificationSearch from './NotificationSearch';

interface Notification {
  id: string;
  notification: {
    _id: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    createdBy: {
      name: string;
      role: string;
    };
    attachment?: {
      filename: string;
      originalName: string;
      mimetype: string;
    };
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationsListProps {
  refreshTrigger?: number;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ refreshTrigger }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    type: 'all',
    priority: 'all',
    dateRange: 'all',
    sender: 'all'
  });

  useEffect(() => {
    loadNotifications();
  }, [currentPage, refreshTrigger]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyNotifications(currentPage, 10);
      setNotifications(data.notifications);
      setTotalPages(data.pagination.totalPages);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="text-red-500" size={20} />;
      case 'announcement': return <MessageSquare className="text-blue-500" size={20} />;
      case 'reminder': return <Clock className="text-orange-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      master_admin: 'Master Admin',
      college_admin: 'College Admin',
      faculty: 'Faculty',
      student: 'Student'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const filteredNotifications = notifications.filter(notification => {
    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = notification.notification.title.toLowerCase().includes(searchLower);
      const messageMatch = notification.notification.message.toLowerCase().includes(searchLower);
      if (!titleMatch && !messageMatch) return false;
    }
    
    // Filter by type
    if (searchFilters.type !== 'all' && notification.notification.type !== searchFilters.type) {
      return false;
    }
    
    // Filter by priority
    if (searchFilters.priority !== 'all' && notification.notification.priority !== searchFilters.priority) {
      return false;
    }
    
    // Filter by date range
    if (searchFilters.dateRange !== 'all') {
      const notificationDate = new Date(notification.createdAt);
      const now = new Date();
      
      switch (searchFilters.dateRange) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (notificationDate < today) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (notificationDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (notificationDate < monthAgo) return false;
          break;
      }
    }
    
    // Filter by sender role
    if (searchFilters.sender !== 'all' && notification.notification.createdBy.role !== searchFilters.sender) {
      return false;
    }
    
    // Read/unread filter
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === filterType
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <NotificationSearch
        onSearch={setSearchTerm}
        onFilter={setSearchFilters}
        searchTerm={searchTerm}
        filters={searchFilters}
      />

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Notifications will appear here when you receive them' : 
               `Switch to "${filter === 'unread' ? 'all' : 'unread'}" to see other notifications`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow border-l-4 p-6 transition-all hover:shadow-md ${
                getPriorityColor(notification.notification.priority)
              } ${!notification.isRead ? 'ring-2 ring-blue-100' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(notification.createdAt)}
                      </span>
                      <span>
                        From: {getRoleDisplayName(notification.notification.createdBy.role)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {notification.notification.priority} priority
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {notification.notification.message}
                      </p>
                    </div>

                    {notification.notification.attachment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            📎
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.notification.attachment.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notification.notification.attachment.mimetype}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {notification.isRead && notification.readAt && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle size={12} />
                        Read on {formatDate(notification.readAt)}
                      </div>
                    )}
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="flex-shrink-0 ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;