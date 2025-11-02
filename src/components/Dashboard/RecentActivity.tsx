import React from 'react';
import { Building, FileText, Bell, User, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  details: string;
  timestamp: string;
  timeAgo: string;
  icon: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'building': return <Building className="h-5 w-5 text-blue-600" />;
      case 'file-text': return <FileText className="h-5 w-5 text-green-600" />;
      case 'bell': return <Bell className="h-5 w-5 text-purple-600" />;
      case 'user': return <User className="h-5 w-5 text-orange-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (iconType: string) => {
    switch (iconType) {
      case 'building': return 'bg-blue-50';
      case 'file-text': return 'bg-green-50';
      case 'bell': return 'bg-purple-50';
      case 'user': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Recent Platform Activity</h3>
        </div>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-start gap-4 p-4 rounded-lg border-l-4 border-blue-500 ${getBackgroundColor(activity.icon)}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;