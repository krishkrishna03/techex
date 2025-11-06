import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import io from 'socket.io-client';
import apiService from '../../services/api';

const socket = io();

const ActivitySummary: React.FC = () => {
  const [activeStudents, setActiveStudents] = useState<number>(0);
  const [adminLoginSummary, setAdminLoginSummary] = useState<{ lastLogin: string | null; totalLogins: number }>({ lastLogin: null, totalLogins: 0 });

  useEffect(() => {
    let mounted = true;

    // Fetch initial summary
    apiService.getActivitySummary().then((res: any) => {
      if (!mounted) return;
      setActiveStudents(res.activeStudents || 0);
      setAdminLoginSummary(res.adminLoginSummary || { lastLogin: null, totalLogins: 0 });
    }).catch(() => {});

    // Subscribe to socket updates
    socket.on('activity:update', (payload: any) => {
      if (!mounted) return;
      setActiveStudents(payload.activeStudents || 0);
    });

    return () => {
      mounted = false;
      socket.off('activity:update');
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-md">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Active Students (last 15m)</p>
          <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-500">Admin Logins</p>
        <p className="text-sm text-gray-800">Total: {adminLoginSummary.totalLogins}</p>
        <p className="text-xs text-gray-500">Last: {adminLoginSummary.lastLogin ? new Date(adminLoginSummary.lastLogin).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ActivitySummary;
