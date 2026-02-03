import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, LogOut, Plus } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { clientMenuSections, isMenuItemActive } from '../../config/clientSidebarMenu';
import { useAuth } from '../../context/AuthContext';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '../ui/sheet';
import { Button } from '../ui/button';

const MenuItem = ({ item, isActive, showLabels }) => {
    const Icon = item.icon;

    return (
        <li key={item.path} role="listitem" className="m-0 p-0">
            <Link
                to={item.path}
                className={`relative flex items-center ${showLabels ? 'gap-3' : 'justify-center'} px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                aria-current={isActive ? 'page' : undefined}
                title={!showLabels ? item.label : undefined}
            >
                {/* Active indicator bar */}
                {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></span>
                )}
                {/* Icon - fixed width for consistent alignment */}
                <span className="inline-flex items-center justify-center w-5 min-w-[20px]">
                    <Icon
                        className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}
                        aria-hidden="true"
                    />
                </span>
                {/* Text label */}
                {showLabels && (
                    <span className={`font-medium text-sm leading-none ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                    </span>
                )}
                {/* Tooltip for collapsed state */}
                {!showLabels && (
                    <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                        {item.label}
                    </span>
                )}
            </Link>
        </li>
    );
};

const ClientSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname, location.search]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const renderMenuItems = (showLabels = true) => {
        return clientMenuSections.map((section, sectionIndex) => (
            <div key={section.id} className={sectionIndex > 0 ? 'mt-4' : ''}>
                {/* Section Label */}
                {showLabels && (
                    <div className="px-3 py-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {section.label}
                        </span>
                    </div>
                )}
                {/* Section Items */}
                {section.items.map((item) => {
                    const isActive = isMenuItemActive(
                        item.path,
                        location.pathname,
                        location.search
                    );
                    return (
                        <MenuItem
                            key={item.path}
                            item={item}
                            isActive={isActive}
                            showLabels={showLabels}
                        />
                    );
                })}
            </div>
        ));
    };

    const SidebarContent = ({ collapsed = false }) => {
        const showLabels = !collapsed;

        return (
            <nav className="h-full flex flex-col">
                {/* Header - Compact */}
                <div className={`flex-shrink-0 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
                    {collapsed ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-sm">D</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Dashboard</h2>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Dreams Events</p>
                                </div>
                            </div>
                            {/* Book New Event CTA - Compact */}
                            <Link to="/dashboard/packages" className="block w-full">
                                <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm group">
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                    <span>Book New Event</span>
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Divider */}
                {showLabels && <div className="mx-3 mb-1 border-t border-gray-200 dark:border-gray-700"></div>}

                {/* Navigation - Scrollable */}
                <ul
                    id="client-sidebar"
                    className="flex-1 px-3 overflow-y-auto overflow-x-hidden sidebar-scrollbar min-h-0 space-y-1 m-0 p-0 list-none"
                    role="list"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
                    }}
                >
                    <style>{`
            #client-sidebar.sidebar-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            #client-sidebar.sidebar-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            #client-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5);
              border-radius: 3px;
            }
            #client-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(156, 163, 175, 0.7);
            }
            .dark #client-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(75, 85, 99, 0.5);
            }
            .dark #client-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(75, 85, 99, 0.7);
            }
          `}</style>
                    {renderMenuItems(showLabels)}
                </ul>

                {/* User Info & Logout - Compact */}
                <div className="border-t border-gray-200 dark:border-gray-700 flex flex-col p-2">
                    {!collapsed && user && (
                        <div className="flex items-center px-2 py-1.5 mb-1">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                    {user.name || user.email}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={`flex items-center gap-2 ${showLabels ? 'justify-start' : 'justify-center'} px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-all duration-200 text-sm`}
                        title={!showLabels ? 'Logout' : undefined}
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        {showLabels && <span>Logout</span>}
                    </Button>
                </div>
            </nav>
        );
    };

    return (
        <>
            {/* Mobile menu with Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <button
                        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-primary-foreground rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                    <div className="p-6 h-full">
                        <SidebarContent collapsed={false} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:block h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-md ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className={`h-full ${isCollapsed ? 'px-3 py-6' : 'p-6'}`}>
                    <SidebarContent collapsed={isCollapsed} />
                </div>
            </aside>
        </>
    );
};

export default ClientSidebar;
