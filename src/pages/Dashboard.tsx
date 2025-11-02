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
import { Bell } from 'lucide-react';
import apiService from '../services/api';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
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
    return roleTitles[state.user.role];
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
      return <ExamManagement key="exam-management" userRole={state.user.role} />;
    }

    // Handle student hierarchy tab for college admin
    if (activeTab === 'student-hierarchy') {
      return <StudentHierarchy key="student-hierarchy" />;
    }

    // Handle reports tab for all roles (student gets their own reports view)
    if (activeTab === 'reports') {
      if (state.user.role === 'student') {
        return <StudentDashboard key="student-reports" activeTab="reports" />;
      }
      return <ReportsPage key="reports" userRole={state.user.role} />;
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

    switch (state.user.role) {
      case 'master_admin':
        return <MasterAdminDashboard key="master-admin-dashboard" activeTab={activeTab} />;
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
    <div className="flex h-screen bg-gray-50">
      {!isTestMode && (
        <Sidebar
          userRole={state.user.role}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {!isTestMode && (
          <Navbar
            title={getDashboardTitle()}
            onProfileClick={() => setShowProfile(true)}
          />
        )}

        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isTestMode ? '' : 'p-6'}`}>
          {renderDashboardContent()}
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