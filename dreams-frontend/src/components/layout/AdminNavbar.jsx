import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationCenter } from '../features';
import { Button } from '../ui/Button';
import ProfileSettingsModal from '../modals/ProfileSettingsModal';
import {
  PanelLeft,
  PanelRight,
  Settings,
  LogOut,
  LayoutDashboard,
  Moon,
  Sun,
} from 'lucide-react';
import { ensureAbsoluteUrl } from '../../utils/imageUtils';

const AdminNavbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isCollapsed, toggleSidebar, mainContentMargin, mainContentWidth } = useSidebar();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileMenuRef = useRef(null);

  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

  // Dropdown only closes when clicking the toggle button itself
  // Removed outside click handler as per user request

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <nav
      className="fixed top-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50 transition-all duration-300"
      style={{
        left: mainContentMargin,
        width: mainContentWidth
      }}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Sidebar toggle button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelRight className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Right side - Dark Mode Toggle, Notifications and Profile */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="group relative p-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:bg-gray-100/80 dark:hover:bg-gray-800/50"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/20 dark:ring-gray-700/30 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#5A45F2]/20">
                {user?.profile_picture ? (
                  <img
                    src={ensureAbsoluteUrl(user.profile_picture)}
                    alt={user?.name || 'Profile'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback to initials if image fails
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="transition-transform duration-300 group-hover:scale-110">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              {/* Active Status Indicator with pulse animation - positioned outside avatar */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg z-10">
                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></span>
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 animate-fade-in bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="p-2">
                  <div className="px-3 py-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                      {user?.email || ''}
                    </p>
                  </div>

                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-[#5A45F2]/10 hover:to-[#7c3aed]/10 dark:hover:from-[#5A45F2]/20 dark:hover:to-[#7c3aed]/20"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#5A45F2] dark:text-[#7ee5ff] group-hover:scale-110 transition-transform" />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-[#5A45F2]/10 hover:to-[#7c3aed]/10 dark:hover:from-[#5A45F2]/20 dark:hover:to-[#7c3aed]/20"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-[#5A45F2] dark:text-[#7ee5ff] group-hover:scale-110 transition-transform" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all group text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </nav>
  );
};

export default AdminNavbar;

