import React from 'react';
import { LogOut, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';

interface NavbarProps {
  title: string;
  onProfileClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, onProfileClick }) => {
  const { state, dispatch } = useAuth();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      master_admin: 'Master Administrator',
      college_admin: 'College Administrator',
      faculty: 'Faculty',
      student: 'Student',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {state.user?.collegeName && (
            <p className="text-sm text-gray-600">{state.user.collegeName}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{state.user?.name}</p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(state.user?.role || '')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <NotificationBell />
            
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile"
              >
                <User size={20} />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;