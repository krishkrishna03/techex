import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import io from 'socket.io-client';
import apiService, { API_BASE_URL } from '../../services/api';

// Use the same API base URL as the Api service. Strip the `/api` suffix for socket base.
const API_BASE = new URL((API_BASE_URL || '').replace('/api', '') || window.location.origin).origin;

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

    // Initialize socket connection at runtime with guards to avoid connecting to
    // third-party hosts during local development. This prevents repeated failed
    // wss attempts when VITE_API_URL is pointed to an external domain.
    let mountedSocket: any = null;

    const shouldConnectSocket = (() => {
      try {
        const apiUrl = new URL(API_BASE);
        const apiHost = apiUrl.hostname;

        // Allow socket when API host is localhost or matches the current origin.
        if (apiHost.includes('localhost') || apiHost === window.location.hostname) return true;

        // In production we may want sockets to connect to remote hosts; allow when NODE_ENV=production
        if (import.meta.env && import.meta.env.MODE === 'production') return true;

        // Otherwise, don't connect (likely points to external dev tooling / vercel hosts)
        return false;
      } catch (err) {
        return false;
      }
    })();

    if (shouldConnectSocket) {
      try {
        mountedSocket = io(API_BASE, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          auth: {
            token: typeof window !== 'undefined' ? localStorage.getItem('token') : null
          }
        });

        mountedSocket.on('activity:update', (payload: any) => {
          if (!mounted) return;
          setActiveStudents(payload.activeStudents || 0);
        });
      } catch (err) {
        // Swallow socket init errors in development to avoid noisy console logs
        console.warn('Socket initialization skipped or failed:', err);
      }
    }

    return () => {
      mounted = false;
      if (mountedSocket) {
        mountedSocket.off('activity:update');
        try { mountedSocket.disconnect(); } catch (e) {}
      }
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
