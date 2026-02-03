import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useNotificationCounts } from '../../context/NotificationContext';
import { mainMenuItems, menuGroups } from '../../config/sidebarMenu';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';


const AdminSidebar = () => {
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { counts } = useNotificationCounts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get badge count for a menu item based on its path
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  const renderMenuItems = (items, showLabels = true, isSubItem = false) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      const badgeCount = getBadgeCount(item.path);

      return (
        <li key={item.path} role="listitem" className="m-0 p-0">
          <Link
            to={item.path}
            className={`relative !flex !items-center gap-3 ${showLabels ? '' : '!justify-center'} px-4 ${isSubItem ? 'py-2.5' : 'py-3'} rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group ${isActive
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            aria-current={isActive ? 'page' : undefined}
            title={!showLabels ? `${item.label}${badgeCount > 0 ? ` (${badgeCount})` : ''}` : undefined}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></span>
            )}
            {/* Icon container - fixed size, always aligned */}
            <span className={`relative flex-shrink-0 flex items-center justify-center ${isSubItem ? 'h-4 w-4' : 'h-5 w-5'}`}>
              <Icon
                className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                  }`}
                aria-hidden="true"
              />
              {/* Badge on icon when collapsed */}
              {!showLabels && badgeCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-500 text-white border-2 border-white dark:border-gray-900 animate-pulse"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Badge>
              )}
            </span>
            {/* Text - follows icon alignment, can be any length */}
            {showLabels && (
              <span className={`flex-1 ${isSubItem ? 'text-sm' : 'text-base'} font-medium whitespace-nowrap min-w-0 ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            )}
            {/* Badge when expanded */}
            {showLabels && badgeCount > 0 && (
              <Badge
                className={`h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-bold ${isActive
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-red-500 hover:bg-red-500 text-white'
                  } ${!isActive ? 'animate-pulse' : ''}`}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
            {!showLabels && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                {item.label}
                {badgeCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {badgeCount}
                  </span>
                )}
              </span>
            )}
          </Link>
        </li>
      );
    });
  };

  const SidebarContent = ({ collapsed = false }) => {
    const showLabels = !collapsed;

    return (
      <nav className="h-full flex flex-col">
        {/* Header - Fixed */}
        <div className={`flex-shrink-0 p-4 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Admin Panel</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dreams Events</p>
            </>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <div
          id="admin-sidebar"
          className="flex-1 px-3 overflow-y-auto overflow-x-hidden sidebar-scrollbar min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
          }}
        >
          <style>{`
            #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5);
              border-radius: 3px;
            }
            #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(156, 163, 175, 0.7);
            }
            .dark #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(75, 85, 99, 0.5);
            }
            .dark #admin-sidebar.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(75, 85, 99, 0.7);
            }
          `}</style>

          {/* Main Navigation */}
          <ul className="space-y-1 m-0 p-0 list-none" role="list">
            {renderMenuItems(mainMenuItems, showLabels)}
          </ul>

          {/* Divider */}
          {!collapsed && (
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
          )}

          {/* Menu Groups */}
          {collapsed ? (
            // Collapsed view - show all individual item icons with tooltips
            <ul className="space-y-1 m-0 p-0 list-none" role="list">
              {menuGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <li key={item.path} role="listitem" className="m-0 p-0">
                        <div className="relative group">
                          <Link
                            to={item.path}
                            className={`relative !flex !items-center !justify-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                              }`}
                            title={item.label}
                          >
                            {/* Active indicator bar */}
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></span>
                            )}
                            <span className="flex-shrink-0 h-5 w-5 flex items-center justify-center">
                              <ItemIcon
                                className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                                  }`}
                                aria-hidden="true"
                              />
                            </span>
                          </Link>
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                            {item.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </div>
              ))}
            </ul>
          ) : (
            // Expanded view - show groups with labels
            <div className="space-y-4">
              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveItem = group.items.some((item) => location.pathname === item.path);

                return (
                  <div key={group.id} className="space-y-1">
                    {/* Group Label */}
                    <div className={`px-4 py-2 flex items-center gap-3 ${hasActiveItem
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      <GroupIcon
                        className="h-4 w-4 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {/* Group Items */}
                    <ul className="space-y-0.5 m-0 p-0 list-none" role="list">
                      {renderMenuItems(group.items, showLabels, true)}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
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
        className={`hidden lg:block h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-md ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div className={`h-full ${isCollapsed ? 'px-3 py-6' : 'p-6'}`}>
          <SidebarContent collapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

