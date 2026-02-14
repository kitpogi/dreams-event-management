import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LogOut,
    LayoutDashboard,
    BookOpen,
    Package,
    Sparkles,
    CreditCard,
    Star,
    Settings,
    ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationCounts } from '../../context/NotificationContext';
import { Badge } from '../ui/badge';
import { ensureAbsoluteUrl } from '../../utils/imageUtils';
import logo from '../../assets/logo.png';

// Menu configuration with enhanced styling
const menuItems = [
    {
        id: 'main',
        label: 'Main Menu',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
            { path: '/dashboard/bookings', label: 'My Bookings', icon: BookOpen, description: 'Manage events' },
            { path: '/dashboard/packages', label: 'Packages', icon: Package, description: 'Browse options' },
            { path: '/dashboard/recommendations', label: 'For You', icon: Sparkles, badge: 'New', badgeColor: 'amber', description: 'AI suggestions' },
        ]
    },
    {
        id: 'account',
        label: 'Account',
        items: [
            { path: '/dashboard/payments', label: 'Payments', icon: CreditCard, description: 'Billing & history' },
            { path: '/dashboard/reviews', label: 'My Reviews', icon: Star, description: 'Your feedback' },
            { path: '/profile/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
        ]
    }
];

const MenuItem = ({ item, isActive, isCollapsed, badgeCount }) => {
    const Icon = item.icon;
    const { darkMode } = useTheme();

    return (
        <Link
            to={item.path}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
                } ${isActive
                    ? darkMode
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/15 text-blue-400'
                        : 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700'
                    : darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            title={isCollapsed ? item.label : undefined}
        >
            {/* Active indicator bar */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
            )}

            {/* Icon with animation */}
            <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 flex-shrink-0 ${isActive
                ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/30'
                : darkMode
                    ? 'bg-gray-800/50 text-gray-400 group-hover:text-blue-400 group-hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                }`}>
                <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${!isCollapsed ? 'group-hover:scale-110' : ''
                    }`} />

                {/* Badge on icon when collapsed */}
                {isCollapsed && badgeCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] bg-red-500 hover:bg-red-500 text-white border-2 border-white dark:border-gray-900 animate-pulse">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </Badge>
                )}
            </span>

            {!isCollapsed && (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-medium text-sm truncate ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                            {item.badge && (
                                <span className={`flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md animate-pulse ${item.badgeColor === 'amber'
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                                    : 'bg-blue-500 text-white'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </div>

                        {/* Numeric badge when expanded */}
                        {badgeCount > 0 && (
                            <Badge className={`flex-shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold ${isActive
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-red-500 hover:bg-red-500 text-white animate-pulse'
                                }`}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Arrow indicator for active */}
            {!isCollapsed && isActive && !badgeCount && (
                <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}

            {/* Enhanced Tooltip for collapsed state */}
            {isCollapsed && (
                <div className={`absolute left-full ml-3 px-3 py-2.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 translate-x-2 group-hover:translate-x-0 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500 text-white">
                                {item.badge}
                            </span>
                        )}
                        {badgeCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500 text-white">
                                {badgeCount}
                            </span>
                        )}
                    </div>
                    {item.description && (
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                        </p>
                    )}
                    {/* Tooltip arrow */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 ${darkMode ? 'bg-gray-800 border-l border-b border-gray-700' : 'bg-white border-l border-b border-gray-200'
                        }`} />
                </div>
            )}
        </Link>
    );
};

const ClientSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { logout, user } = useAuth();
    const { darkMode } = useTheme();
    const { counts } = useNotificationCounts();

    const getBadgeCount = (path) => {
        switch (path) {
            case '/dashboard/bookings':
                return counts.pendingBookings;
            case '/dashboard/payments':
                return counts.pendingPayments;
            default:
                return 0;
        }
    };

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <aside
            className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ease-out border-none bg-transparent ${isCollapsed ? 'w-20' : 'w-60'}`}
        >
            {/* Logo/Brand */}
            <div className={`relative px-4 h-16 flex items-center`}>
                {isCollapsed ? (
                    <Link
                        to="/"
                        className="flex justify-center group"
                        title="D'Dreams - Back to Home"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden transition-transform group-hover:scale-105">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                    </Link>
                ) : (
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden transition-transform group-hover:scale-105 flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="min-w-0">
                            <h2 className={`font-bold text-base leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Client Panel
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
                {menuItems.map((section, index) => (
                    <div key={section.id} className={index > 0 ? 'mt-4' : ''}>
                        {/* Section label */}
                        {!isCollapsed && (
                            <p className={`px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                {section.label}
                            </p>
                        )}

                        {/* Collapsed state section divider */}
                        {isCollapsed && index > 0 && (
                            <div className={`mx-auto w-8 h-px mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
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
                                />
                            ))}
                        </div>
                    </div>
                ))}

            </nav>

            {/* User section */}
            <div className={`relative p-2.5`}>
                {!isCollapsed ? (
                    <div className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white'
                        }`}>
                        {/* User avatar with online indicator */}
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                                {user?.profile_picture ? (
                                    <img
                                        src={ensureAbsoluteUrl(user.profile_picture)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-bold text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                            {/* Online indicator with pulse */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm z-10">
                                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
                            </span>
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {user?.name}
                            </p>
                            <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                                {user?.profile_picture ? (
                                    <img
                                        src={ensureAbsoluteUrl(user.profile_picture)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-bold text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm z-10">
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

export default ClientSidebar;
