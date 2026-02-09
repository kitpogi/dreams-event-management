import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { useState, useEffect, useRef } from 'react';
import {
    LogOut,
    Moon,
    Sun,
    Heart,
    ChevronLeft,
    ChevronRight,
    PanelLeft,
    PanelRight,
    Home,
    Search,
    Plus,
    Settings,
    User,
    HelpCircle,
    X,
    Package,
    Calendar,
    CreditCard,
    Menu
} from 'lucide-react';
import { NotificationCenter } from '../features';
import { ensureAbsoluteUrl } from '../../utils/imageUtils';
import logo from '../../assets/logo.png';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '../ui/sheet';

const DashboardHeader = () => {
    const { user, logout, isAdmin } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

    // Quick search options
    const quickSearchItems = [
        { label: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
        { label: 'Browse Packages', path: '/dashboard/packages', icon: Package },
        { label: 'Payment History', path: '/dashboard/payments', icon: CreditCard },
        { label: 'Account Settings', path: '/profile/settings', icon: Settings },
        { label: 'My Favorites', path: '/favorites', icon: Heart },
    ];

    const filteredSearchItems = quickSearchItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Keyboard shortcut for search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowDropdown(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.user-menu')) {
                setShowDropdown(false);
            }
            if (showSearch && !event.target.closest('.search-modal')) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, showSearch]);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate('/');
    };

    const handleSearchSelect = (path) => {
        navigate(path);
        setShowSearch(false);
        setSearchQuery('');
    };

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.includes('/bookings')) return 'My Bookings';
        if (path.includes('/packages')) return 'Packages';
        if (path.includes('/payments')) return 'Payments';
        if (path.includes('/reviews')) return 'Reviews';
        if (path.includes('/recommendations')) return 'For You';
        if (path.includes('/settings')) return 'Settings';
        return 'Dashboard';
    };

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <>
            <header
                className={`fixed top-0 right-0 z-40 transition-all duration-300 h-16 ${darkMode
                    ? 'bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50'
                    : 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm'
                    }`}
                style={{
                    left: isMobile ? 0 : (isCollapsed ? '5rem' : '16rem'),
                }}
            >
                <div className="h-full px-3 lg:px-6 flex items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                        {isMobile ? (
                            // Mobile: Hamburger menu
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button
                                        className={`p-2 rounded-xl transition-all ${darkMode
                                            ? 'hover:bg-gray-800 text-gray-400'
                                            : 'hover:bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72 p-0">
                                    <MobileSidebar />
                                </SheetContent>
                            </Sheet>
                        ) : (
                            // Desktop: Collapse toggle
                            <button
                                onClick={toggleSidebar}
                                className={`p-2 rounded-xl transition-all ${darkMode
                                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                    }`}
                                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {isCollapsed ? (
                                    <PanelRight className="w-5 h-5" />
                                ) : (
                                    <PanelLeft className="w-5 h-5" />
                                )}
                            </button>
                        )}

                        {/* Page title / Greeting */}
                        <div className="hidden md:block min-w-0">
                            <h1 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {getPageTitle()}
                            </h1>
                            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                            </p>
                        </div>

                        {/* Mobile: Logo */}
                        {isMobile && (
                            <Link to={dashboardPath} className="flex items-center gap-2">
                                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                            </Link>
                        )}
                    </div>

                    {/* Center - Search bar (desktop) */}
                    <div className="hidden lg:flex flex-1 max-w-md">
                        <button
                            onClick={() => setShowSearch(true)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${darkMode
                                ? 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
                                }`}
                        >
                            <Search className="w-4 h-4" />
                            <span className="text-sm">Quick search...</span>
                            <kbd className={`ml-auto px-2 py-0.5 rounded text-xs font-mono ${darkMode
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-1 lg:gap-2">
                        {/* Mobile search */}
                        <button
                            onClick={() => setShowSearch(true)}
                            className={`lg:hidden p-2 rounded-xl transition-all ${darkMode
                                ? 'hover:bg-gray-800 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Quick action - Book Event */}
                        <Link
                            to="/dashboard/packages"
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">Book Event</span>
                        </Link>

                        {/* Website link */}
                        <Link
                            to="/"
                            className={`p-2 rounded-xl transition-all ${darkMode
                                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                            title="Back to Website"
                        >
                            <Home className="w-5 h-5" />
                        </Link>

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 rounded-xl transition-all ${darkMode
                                ? 'hover:bg-gray-800 text-yellow-400'
                                : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Notifications */}
                        <NotificationCenter />

                        {/* User menu */}
                        <div className="relative user-menu ml-1">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all ${darkMode
                                    ? 'hover:bg-gray-800'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                                    {user?.profile_picture ? (
                                        <img
                                            src={ensureAbsoluteUrl(user.profile_picture)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="text-white text-sm font-semibold">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    )}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm">
                                        <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></span>
                                    </span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform duration-200 hidden sm:block ${showDropdown ? 'rotate-90' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </button>

                            {/* Dropdown */}
                            {showDropdown && (
                                <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 ${darkMode
                                    ? 'bg-gray-900 border-gray-800'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    {/* User info header */}
                                    <div className={`p-4 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                                                {user?.profile_picture ? (
                                                    <img src={ensureAbsoluteUrl(user.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white text-lg font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {user?.name}
                                                </p>
                                                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="p-2">
                                        <Link
                                            to="/profile/settings"
                                            onClick={() => setShowDropdown(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${darkMode
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <User className="w-4 h-4" />
                                            <span className="text-sm">Account Settings</span>
                                        </Link>
                                        <Link
                                            to="/favorites"
                                            onClick={() => setShowDropdown(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${darkMode
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span className="text-sm">My Favorites</span>
                                        </Link>
                                        <Link
                                            to="/"
                                            onClick={() => setShowDropdown(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${darkMode
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Home className="w-4 h-4" />
                                            <span className="text-sm">Back to Website</span>
                                        </Link>
                                        <a
                                            href="#help"
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${darkMode
                                                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            <span className="text-sm">Help & Support</span>
                                        </a>
                                    </div>

                                    {/* Logout */}
                                    <div className={`p-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${darkMode
                                                ? 'text-red-400 hover:bg-red-500/10'
                                                : 'text-red-600 hover:bg-red-50'
                                                }`}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">Sign out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Modal / Command Palette */}
            {showSearch && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSearch(false)} />

                    {/* Modal */}
                    <div className={`search-modal relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden ${darkMode
                        ? 'bg-gray-900 border border-gray-800'
                        : 'bg-white border border-gray-200'
                        }`}>
                        {/* Search input */}
                        <div className={`flex items-center gap-3 p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search pages, actions..."
                                className={`flex-1 bg-transparent text-lg outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                            />
                            <button
                                onClick={() => setShowSearch(false)}
                                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                            >
                                <X className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="p-2 max-h-80 overflow-y-auto">
                            <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Quick Navigation
                            </p>
                            {filteredSearchItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleSearchSelect(item.path)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${darkMode
                                            ? 'hover:bg-gray-800 text-gray-300'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode
                                            ? 'bg-gray-800'
                                            : 'bg-gray-100'
                                            }`}>
                                            <Icon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer hint */}
                        <div className={`p-3 border-t text-center ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                            <span className="text-xs">Press <kbd className={`px-1.5 py-0.5 rounded text-xs mx-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>ESC</kbd> to close</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Mobile Sidebar Component
const MobileSidebar = () => {
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
        { path: '/dashboard/packages', label: 'Packages', icon: Package },
        { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
        { path: '/favorites', label: 'Favorites', icon: Heart },
        { path: '/profile/settings', label: 'Settings', icon: Settings },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                        <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>D'Dreams</h2>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : darkMode
                                    ? 'text-gray-300 hover:bg-gray-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <Link
                    to="/"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border transition-all ${darkMode
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Website</span>
                </Link>
            </div>
        </div>
    );
};

export default DashboardHeader;
