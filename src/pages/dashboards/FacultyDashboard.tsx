import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Building, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FacultyTestsPage from '../../components/Test/FacultyTestsPage';
import FacultyStudentReports from '../../components/Test/FacultyStudentReports';
import FacultyTestReports from '../../components/Test/FacultyTestReports';

interface College {
  name: string;
  code: string;
  address: string;
}

interface Colleague {
  _id: string;
  name: string;
  email: string;
  branch: string;
  batch?: string;
  section?: string;
}

interface DashboardData {
  college: College;
  colleagues: Colleague[];
}

interface FacultyDashboardProps {
  activeTab: string;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ activeTab }) => {
  const { state } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCollegeDashboard();
      setDashboardData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-12">
        <p>{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  if (activeTab === 'tests') {
    return <FacultyTestsPage />;
  }

  if (activeTab === 'test-reports') {
    return <FacultyTestReports />;
  }

  if (activeTab === 'student-reports') {
    return <FacultyStudentReports />;
  }

  if (activeTab === 'profile') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Faculty Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <p className="mt-1 text-lg text-gray-900">{state.user?.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{state.user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-900">Faculty</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">College</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">College Code</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.code}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome, {state.user?.name}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-gray-700" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">College</p>
                <p className="text-lg font-bold text-gray-900">{dashboardData.college.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-gray-700" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Code</p>
                <p className="text-lg font-bold text-gray-900">{dashboardData.college.code}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-700" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Fellow Faculty</p>
                <p className="text-lg font-bold text-gray-900">{dashboardData.colleagues.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">College Information</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">College Name</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">College Code</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-gray-900">{dashboardData.college.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Fellow Faculty Members</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4">
            {dashboardData.colleagues.map((colleague) => (
              <div key={colleague._id} className="flex items-center p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">{colleague.name}</h4>
                  <p className="text-sm text-gray-500">{colleague.email}</p>
                  <p className="text-sm text-gray-500">Department: {colleague.branch}</p>
                </div>
              </div>
            ))}
          </div>
          
          {dashboardData.colleagues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No other faculty members in your college yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;