import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Hash, BookOpen, Calendar, Users, Save, CreditCard as Edit, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProfilePage: React.FC = () => {
  const { state, dispatch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    branch: '',
    batch: '',
    section: '',
    idNumber: '',
    // College specific fields
    address: '',
    code: '',
    // Master admin specific fields
    companyName: '',
    companyAddress: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [collegeStats, setCollegeStats] = useState({
    totalFaculty: 0,
    totalStudents: 0
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const userData = await apiService.getCurrentUser();
      
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        branch: userData.branch || '',
        batch: userData.batch || '',
        section: userData.section || '',
        idNumber: userData.idNumber || '',
        address: userData.collegeId?.address || '',
        code: userData.collegeId?.code || '',
        companyName: userData.companyName || '',
        companyAddress: userData.companyAddress || ''
      });

      // Load college stats for college admin
      if (state.user?.role === 'college_admin') {
        const dashboardData = await apiService.getCollegeDashboard();
        setCollegeStats({
          totalFaculty: dashboardData.totalFaculty || 0,
          totalStudents: dashboardData.totalStudents || 0
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load profile data' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData: any = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber
      };

      // Add role-specific fields
      if (state.user?.role === 'faculty' || state.user?.role === 'student') {
        updateData.branch = profileData.branch;
        updateData.batch = profileData.batch;
        updateData.section = profileData.section;
      }

      // For college admin, update college info
      if (state.user?.role === 'college_admin') {
        updateData.address = profileData.address;
        // Note: College code cannot be updated
      }

      // For master admin, update company info
      if (state.user?.role === 'master_admin') {
        updateData.companyName = profileData.companyName;
        updateData.companyAddress = profileData.companyAddress;
      }

      const updatedUser = await apiService.updateProfile(updateData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await apiService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      master_admin: 'Master Administrator',
      college_admin: 'College Administrator',
      faculty: 'Faculty',
      student: 'Student'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getEditableFields = () => {
    const role = state.user?.role;
    switch (role) {
      case 'master_admin':
        return ['name', 'phoneNumber', 'companyName', 'companyAddress'];
      case 'college_admin':
        return ['name', 'phoneNumber', 'address'];
      case 'faculty':
      case 'student':
        return ['name', 'phoneNumber', 'branch', 'batch', 'section'];
      default:
        return ['name', 'phoneNumber'];
    }
  };

  const isFieldEditable = (field: string) => {
    return getEditableFields().includes(field);
  };

  if (loading && !profileData.name) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
              <p className="text-gray-600">{getRoleDisplayName(state.user?.role || '')}</p>
              {state.user?.collegeName && (
                <p className="text-sm text-gray-500">{state.user.collegeName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    loadProfileData(); // Reset changes
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* College Stats for College Admin */}
        {state.user?.role === 'college_admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                  <p className="text-2xl font-bold text-gray-900">{collegeStats.totalFaculty}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{collegeStats.totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <form onSubmit={handleProfileSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Full Name
                </label>
                {editing && isFieldEditable('name') ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profileData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address
                </label>
                <p className="text-gray-900 py-2">{profileData.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                {editing && isFieldEditable('phoneNumber') ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profileData.phoneNumber || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Role-specific Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {state.user?.role === 'master_admin'
                  ? 'Company Information'
                  : state.user?.role === 'college_admin'
                    ? 'College Information'
                    : 'Academic Information'}
              </h3>

              {state.user?.role === 'master_admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline w-4 h-4 mr-1" />
                      Role
                    </label>
                    <p className="text-gray-900 py-2 capitalize">{getRoleDisplayName(state.user.role)}</p>
                    <p className="text-xs text-gray-500">Role cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="inline w-4 h-4 mr-1" />
                      Company Name
                    </label>
                    {editing && isFieldEditable('companyName') ? (
                      <input
                        type="text"
                        name="companyName"
                        value={profileData.companyName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.companyName || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="inline w-4 h-4 mr-1" />
                      Company Address
                    </label>
                    {editing && isFieldEditable('companyAddress') ? (
                      <textarea
                        name="companyAddress"
                        value={profileData.companyAddress}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.companyAddress || 'Not provided'}</p>
                    )}
                  </div>
                </>
              )}

              {state.user?.role === 'college_admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Hash className="inline w-4 h-4 mr-1" />
                      College Code
                    </label>
                    <p className="text-gray-900 py-2">{profileData.code}</p>
                    <p className="text-xs text-gray-500">College code cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="inline w-4 h-4 mr-1" />
                      College Address
                    </label>
                    {editing && isFieldEditable('address') ? (
                      <textarea
                        name="address"
                        value={profileData.address}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.address}</p>
                    )}
                  </div>
                </>
              )}

              {(state.user?.role === 'faculty' || state.user?.role === 'student') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Hash className="inline w-4 h-4 mr-1" />
                      {state.user?.role === 'student' ? 'Roll Number' : 'ID Number'}
                    </label>
                    <p className="text-gray-900 py-2">{profileData.idNumber}</p>
                    <p className="text-xs text-gray-500">ID cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BookOpen className="inline w-4 h-4 mr-1" />
                      Branch/Department
                    </label>
                    {editing && isFieldEditable('branch') ? (
                      <input
                        type="text"
                        name="branch"
                        value={profileData.branch}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.branch}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Batch/Year
                    </label>
                    {editing && isFieldEditable('batch') ? (
                      <input
                        type="text"
                        name="batch"
                        value={profileData.batch}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.batch}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users className="inline w-4 h-4 mr-1" />
                      Section
                    </label>
                    {editing && isFieldEditable('section') ? (
                      <input
                        type="text"
                        name="section"
                        value={profileData.section}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.section}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            <Lock className="inline w-5 h-5 mr-2" />
            Security Settings
          </h3>
          
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Change Password
            </button>
          ) : (
            <button
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save size={16} />
                )}
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;