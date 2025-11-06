import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface NotificationSearchProps {
  onSearch: (term: string) => void;
  onFilter: (filters: NotificationFilters) => void;
  searchTerm: string;
  filters: NotificationFilters;
}

interface NotificationFilters {
  type: string;
  priority: string;
  dateRange: string;
  sender: string;
}

const NotificationSearch: React.FC<NotificationSearchProps> = ({
  onSearch,
  onFilter,
  searchTerm,
  filters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    onFilter({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilter({
      type: 'all',
      priority: 'all',
      dateRange: 'all',
      sender: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search notifications by title or content..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="general">📢 General</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="announcement">📣 Announcement</option>
              <option value="reminder">⏰ Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
            <select
              value={filters.sender}
              onChange={(e) => handleFilterChange('sender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Senders</option>
              <option value="master_admin">Master Admin</option>
              <option value="college_admin">College Admin</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSearch;