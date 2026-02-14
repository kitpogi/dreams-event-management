import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationCounts } from '../../context/NotificationContext';
import { Badge } from '../ui/badge';
import { ensureAbsoluteUrl } from '../../utils/imageUtils';
import logo from '../../assets/logo.png';
import { mainMenuItems, menuGroups } from '../../config/sidebarMenu';

/**
 * MenuItem component — dark blue gradient theme for admin dashboard
 */
const MenuItem = ({ item, isActive, isCollapsed, badgeCount, isSubItem = false }) => {
  const Icon = item.icon;
  const { darkMode } = useTheme();

  return (
    <Link
      to={item.path}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-500 ease-out ${isCollapsed ? 'justify-center' : ''
        } ${isActive
          ? darkMode
            ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
            : 'bg-blue-50/80 text-blue-700 shadow-sm'
          : darkMode
            ? 'text-slate-400 hover:text-white hover:bg-white/5'
            : 'text-slate-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Active interaction glow */}
      {isActive && (
        <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-full blur-[2px] opacity-80" />
      )}

      {/* Modern Icon Interface */}
      <span className={`relative flex items-center justify-center ${isSubItem ? 'w-6 h-6' : 'w-8 h-8'} rounded-xl transition-all duration-500 flex-shrink-0 ${isActive
        ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/20'
        : darkMode
          ? 'bg-slate-800/40 text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800/80'
          : 'bg-slate-100/50 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
        }`}>
        <Icon className={`${isSubItem ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'} transition-transform duration-500 ${!isCollapsed ? 'group-hover:scale-110' : ''}`} />

        {/* Dynamic Badge Engine */}
        {isCollapsed && badgeCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[8px] bg-indigo-500 hover:bg-indigo-600 text-white border-2 border-[#0d1529] rounded-full">
            {badgeCount > 9 ? '9+' : badgeCount}
          </Badge>
        )}
      </span>

      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <span className={`text-[13px] font-bold tracking-tight truncate ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
              {item.label}
            </span>

            {/* Numeric badge when expanded */}
            {badgeCount > 0 && (
              <Badge className={`flex-shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-black tracking-tighter rounded-lg ${isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-indigo-600/20 text-indigo-400'
                }`}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Subtle chevron for active sub-items */}
      {!isCollapsed && isActive && (
        <ChevronRight className="w-3.5 h-3.5 text-blue-500/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      )}

      {/* Apple-style floating tooltip */}
      {isCollapsed && (
        <div className={`absolute left-full ml-4 px-4 py-2 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none whitespace-nowrap z-50 translate-x-3 group-hover:translate-x-0 backdrop-blur-3xl border ${darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
          }`}>
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs tracking-tight">
              {item.label}
            </span>
            {badgeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-indigo-500 text-white">
                {badgeCount}
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
};

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { logout, user } = useAuth();
  const { darkMode } = useTheme();
  const { counts } = useNotificationCounts();

  const getBadgeCount = (path) => {
    switch (path) {
      case '/admin/bookings':
        return counts.pendingBookings;
      case '/admin/contact-inquiries':
        return counts.newInquiries;
      default:
        return 0;
    }
  };

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Build sections from the admin sidebarMenu config
  const sections = [
    {
      id: 'main',
      label: 'Core Interface',
      items: mainMenuItems,
    },
    ...menuGroups,
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-500 ease-in-out ${darkMode ? 'bg-[#0d1529]/80 backdrop-blur-3xl' : 'bg-white'} ${isCollapsed ? 'w-24' : 'w-64'}`}
    >
      {/* Logo/Brand */}
      <div className={`relative px-3 h-16 flex items-center`}>
        {isCollapsed ? (
          <Link
            to="/"
            className="flex justify-center group"
            title="D'Dreams - Back to Home"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm overflow-hidden transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
              <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className={`font-bold text-base leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Panel
              </h2>
              <p className={`text-[11px] font-medium leading-tight mt-0.5 ${darkMode ? 'text-blue-400/60' : 'text-gray-400'}`}>
                Dreams Events
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        {sections.map((section, index) => (
          <div key={section.id} className={index > 0 ? 'mt-4' : ''}>
            {/* Section label */}
            {!isCollapsed && (
              <p className={`px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider ${darkMode ? 'text-blue-400/40' : 'text-gray-400'
                }`}>
                {section.label}
              </p>
            )}

            {/* Collapsed state section divider */}
            {isCollapsed && index > 0 && (
              <div className={`mx-auto w-8 h-px mb-3 ${darkMode ? 'bg-blue-900/40' : 'bg-gray-200'}`} />
            )}

            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <MenuItem
                  key={item.path}
                  item={item}
                  isActive={isActive(item.path)}
                  isCollapsed={isCollapsed}
                  badgeCount={getBadgeCount(item.path)}
                  isSubItem={section.id !== 'main'}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={`relative p-2.5 transition-colors`}>
        {!isCollapsed ? (
          <div className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-blue-900/20' : 'hover:bg-white'
            }`}>
            {/* User avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden">
                {user?.profile_picture ? (
                  <img
                    src={ensureAbsoluteUrl(user.profile_picture)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0a1628] rounded-full shadow-sm z-10">
                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
              </span>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.name}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-blue-400/50' : 'text-gray-500'}`}>
                {user?.email}
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-all hover:scale-105 ${darkMode
                ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Collapsed avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden">
                {user?.profile_picture ? (
                  <img
                    src={ensureAbsoluteUrl(user.profile_picture)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0a1628] rounded-full shadow-sm z-10">
                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
              </span>
            </div>

            {/* Collapsed logout */}
            <button
              onClick={handleLogout}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 ${darkMode
                ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
