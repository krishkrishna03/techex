import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';

interface NavbarProps {
  title: string;
  onProfileClick?: () => void;
  onTabChange?: (tab: string) => void;
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, onProfileClick, onTabChange, onToggleSidebar }) => {
  const { state, dispatch } = useAuth();
  // logo fetching removed — use default static asset in the markup

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
    <nav className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => onToggleSidebar && onToggleSidebar()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
            title="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{title}</h1>
            {state.user?.collegeName && (
              <p className="text-xs md:text-sm text-gray-600 truncate max-w-[200px] md:max-w-none">
                {state.user.collegeName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{state.user?.name}</p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(state.user?.role || '')}
            </p>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell onNavigate={onTabChange} />
            
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile"
              >
                <User size={18} className="md:w-5 md:h-5" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
