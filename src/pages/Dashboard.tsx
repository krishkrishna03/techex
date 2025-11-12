import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';

// Dashboard components
import MasterAdminDashboard from './dashboards/MasterAdminDashboard';
import CollegeAdminDashboard from './dashboards/CollegeAdminDashboard';
import FacultyDashboard from './dashboards/FacultyDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

// Profile component
import ProfileModal from '../components/Profile/ProfileModal';
import NotificationsList from '../components/Notifications/NotificationsList';
import ProfilePage from '../components/Profile/ProfilePage';
import NotificationForm from '../components/Notifications/NotificationForm';
import NotificationAnalytics from '../components/Notifications/NotificationAnalytics';
import StudentHierarchy from '../components/Student/StudentHierarchy';
import ReportsPage from '../components/Reports/ReportsPage';
import ExamManagement from '../components/Exam/ExamManagement';
import { Bell, Menu } from 'lucide-react';
import apiService from '../services/api';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  // isSidebarOpen controls desktop expanded/collapsed state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // isDrawerOpen controls mobile off-canvas drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Persist sidebar open/closed in localStorage so users keep preference across reloads
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebarCollapsed');
      if (stored !== null) {
        setIsSidebarOpen(stored === 'false' ? true : false);
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const [showProfile, setShowProfile] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  // Listen for test mode changes
  useEffect(() => {
    const handleTestModeChange = (event: CustomEvent) => {
      console.log('Dashboard received testModeChanged event:', event.detail);
      setIsTestMode(event.detail.isTestMode);
    };

    window.addEventListener('testModeChanged', handleTestModeChange as EventListener);
    return () => {
      window.removeEventListener('testModeChanged', handleTestModeChange as EventListener);
    };
  }, []);

  if (!state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getDashboardTitle = () => {
    const roleTitles = {
      master_admin: 'Master Admin Dashboard',
      college_admin: 'College Admin Dashboard',
      faculty: 'Faculty Dashboard',
      student: 'Student Dashboard',
    };
    return roleTitles[state.user!.role];
  };

  const renderDashboardContent = () => {
    // Handle notifications tab for all roles
    if (activeTab === 'notifications') {
      return <NotificationsList key="notifications" />;
    }

    // Handle notification analytics tab for master admin
    if (activeTab === 'notification-analytics') {
      return <NotificationAnalytics key="notification-analytics" />;
    }

    // Handle exam management tab for all roles
    if (activeTab === 'exam-management') {
      return <ExamManagement key="exam-management" userRole={state.user!.role} />;
    }

    // Handle student hierarchy tab for college admin
    if (activeTab === 'student-hierarchy') {
      return <StudentHierarchy key="student-hierarchy" />;
    }

    // Handle reports tab for all roles (student gets their own reports view)
    if (activeTab === 'reports') {
      if (state.user!.role === 'student') {
        return <StudentDashboard key="student-reports" activeTab="reports" />;
      }
      return <ReportsPage key="reports" userRole={state.user!.role} />;
    }

    // Handle create notification tab for admins
    if (activeTab === 'create-notification') {
      return (
        <div key="create-notification" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
                  <p className="text-gray-600">Send notifications to users in your scope</p>
                </div>
              </div>
            </div>
            <NotificationForm
              onSubmit={async (formData) => {
                await apiService.createNotificationWithFile(formData);
              }}
              loading={false}
              onClose={() => setActiveTab('notifications')}
            />
          </div>
        </div>
      );
    }

    // Handle profile tab for all roles
    if (activeTab === 'profile') {
      return <ProfilePage key="profile" />;
    }

    switch (state.user!.role) {
      case 'master_admin':
        return <MasterAdminDashboard key="master-admin-dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'college_admin':
        return <CollegeAdminDashboard key="college-admin-dashboard" activeTab={activeTab} />;
      case 'faculty':
        return <FacultyDashboard key="faculty-dashboard" activeTab={activeTab} />;
      case 'student':
        return <StudentDashboard key="student-dashboard" activeTab={activeTab} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile menu toggle button - only visible on small screens */}
      {!isTestMode && (
        // Mobile floating toggle: opens the drawer
        <button
          onClick={() => setIsDrawerOpen(v => !v)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-600 hover:bg-gray-100 md:hidden"
          title="Toggle menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      {!isTestMode && (
        <Sidebar
          userRole={state.user.role}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // close drawer on mobile after navigation
            setIsDrawerOpen(false);
          }}
          collapsed={!isSidebarOpen}
          drawerOpen={isDrawerOpen}
          onCloseDrawer={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out 
        ${!isTestMode ? 'md:ml-0' : ''}`}>
        {!isTestMode && (
          <Navbar
            title={getDashboardTitle()}
            onProfileClick={() => setShowProfile(true)}
            onTabChange={setActiveTab}
            onToggleSidebar={() => {
              // Toggle desktop collapse by default
              // If on small screens, user will use the floating button which controls drawer
              setIsSidebarOpen(v => {
                const next = !v;
                try { localStorage.setItem('sidebarCollapsed', String(!next)); } catch (e) {}
                return next;
              });
            }}
          />
        )}

        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 
          ${isTestMode ? '' : 'p-4 md:p-6'}`}>
          <div className={`container mx-auto ${isTestMode ? '' : 'max-w-7xl'}`}>
            {renderDashboardContent()}
          </div>
        </main>
      </div>

      {!isTestMode && (
      <Modal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="Profile"
        size="md"
      >
        <ProfileModal onClose={() => setShowProfile(false)} />
      </Modal>
      )}
    </div>
  );
};

export default Dashboard;
