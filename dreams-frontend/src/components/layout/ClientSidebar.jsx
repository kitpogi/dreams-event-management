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

const MenuItem = ({ item, isActive, isCollapsed }) => {
    const Icon = item.icon;
    const { darkMode } = useTheme();

    return (
        <Link
            to={item.path}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
            } ${
                isActive
                    ? darkMode
                        ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-400'
                        : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700'
                    : darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={isCollapsed ? item.label : undefined}
        >
            {/* Active indicator bar */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-r-full" />
            )}

            {/* Icon with animation */}
            <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isActive 
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
                    : darkMode
                        ? 'bg-gray-800/50 text-gray-400 group-hover:text-purple-400 group-hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-500 group-hover:text-purple-600 group-hover:bg-purple-50'
            }`}>
                <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${
                    !isCollapsed ? 'group-hover:scale-110' : ''
                }`} />
            </span>
            
            {!isCollapsed && (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md animate-pulse ${
                                item.badgeColor === 'amber' 
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' 
                                    : 'bg-purple-500 text-white'
                            }`}>
                                {item.badge}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Arrow indicator for active */}
            {!isCollapsed && isActive && (
                <ChevronRight className="w-4 h-4 text-purple-500" />
            )}

            {/* Enhanced Tooltip for collapsed state */}
            {isCollapsed && (
                <div className={`absolute left-full ml-3 px-3 py-2.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 translate-x-2 group-hover:translate-x-0 ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
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
                    </div>
                    {item.description && (
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                        </p>
                    )}
                    {/* Tooltip arrow */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 ${
                        darkMode ? 'bg-gray-800 border-l border-b border-gray-700' : 'bg-white border-l border-b border-gray-200'
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
            className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 transition-all duration-300 ease-out ${
                darkMode 
                    ? 'bg-gray-900/80 backdrop-blur-2xl border-r border-gray-800/50' 
                    : 'bg-white/80 backdrop-blur-2xl border-r border-gray-200/50'
            } ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Logo/Brand */}
            <div className={`relative px-3 py-2.5 ${!isCollapsed ? 'border-b' : ''} ${darkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
                {isCollapsed ? (
                    <Link 
                        to="/" 
                        className="flex justify-center group"
                        title="D'Dreams - Back to Home"
                    >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 overflow-hidden transition-transform group-hover:scale-105">
                            <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                    </Link>
                ) : (
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 overflow-hidden transition-transform group-hover:scale-105 flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                            <h2 className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                D'Dreams
                            </h2>
                            <p className={`text-[10px] leading-tight ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Event Planning
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
                            <p className={`px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider ${
                                darkMode ? 'text-gray-500' : 'text-gray-400'
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
                                />
                            ))}
                        </div>
                    </div>
                ))}

            </nav>

            {/* User section */}
            <div className={`relative p-2.5 border-t ${darkMode ? 'border-gray-800/50 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                {!isCollapsed ? (
                    <div className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-colors ${
                        darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white'
                    }`}>
                        {/* User avatar with online indicator */}
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
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
                            {/* Online indicator */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
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
                            className={`p-2 rounded-lg transition-all hover:scale-105 ${
                                darkMode 
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
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
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
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full" />
                        </div>
                        
                        {/* Collapsed logout */}
                        <button
                            onClick={handleLogout}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 ${
                                darkMode 
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
