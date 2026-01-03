import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  CubeIcon,
  CalendarDaysIcon,
  UsersIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useSidebar } from '../../context/SidebarContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';

const AdminSidebar = () => {
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openAccordions, setOpenAccordions] = useState([]);

  // Main navigation items (always visible)
  const mainMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  // Organized menu groups
  const menuGroups = [
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarDaysIcon,
      items: [
        { path: '/admin/bookings', label: 'All Bookings', icon: CalendarDaysIcon },
        { path: '/admin/bookings/calendar', label: 'Calendar View', icon: CalendarDaysIcon },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      icon: CubeIcon,
      items: [
        { path: '/admin/packages', label: 'Packages', icon: CubeIcon },
        { path: '/admin/venues', label: 'Venues', icon: BuildingOfficeIcon },
        { path: '/admin/portfolio', label: 'Portfolio', icon: PhotoIcon },
        { path: '/admin/testimonials', label: 'Testimonials', icon: ChatBubbleLeftRightIcon },
      ],
    },
    {
      id: 'users',
      label: 'Users & Clients',
      icon: UsersIcon,
      items: [
        { path: '/admin/clients', label: 'Clients', icon: UsersIcon },
        { path: '/admin/contact-inquiries', label: 'Inquiries', icon: EnvelopeIcon },
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: DocumentTextIcon,
      items: [
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: DocumentTextIcon },
      ],
    },
  ];

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

  const renderMenuItems = (items, showLabels = true) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <li key={item.path} role="listitem">
          <Link
            to={item.path}
            className={`flex items-center ${showLabels ? 'space-x-3' : 'justify-center'} px-4 py-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group text-sm ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
            aria-current={isActive ? 'page' : undefined}
            title={!showLabels ? item.label : undefined}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />
            {showLabels && (
              <span className="font-medium">{item.label}</span>
            )}
            {!showLabels && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
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
      <>
        <div className={`mb-6 ${collapsed ? 'flex justify-center' : ''}`}>
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
        <nav id="admin-sidebar" className="flex-1" aria-label="Admin navigation" role="navigation">
          {/* Main Navigation */}
          <div className="mb-4">
            <ul className="space-y-1" role="list">
              {renderMenuItems(mainMenuItems, showLabels)}
            </ul>
          </div>

          {/* Divider */}
          {!collapsed && (
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
          )}

          {/* Menu Groups */}
          {collapsed ? (
            // Collapsed view - show all individual item icons with tooltips
            <div className="space-y-1">
              {menuGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <div key={item.path} className="relative group">
                        <Link
                          to={item.path}
                          className={`flex items-center justify-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                          title={item.label}
                        >
                          <ItemIcon
                            className={`h-5 w-5 flex-shrink-0 ${
                              isActive ? 'text-white' : 'text-gray-400'
                            }`}
                            aria-hidden="true"
                          />
                        </Link>
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            // Expanded view - show accordion
            <Accordion 
              type="multiple" 
              className="space-y-1" 
              value={openAccordions}
              onValueChange={setOpenAccordions}
            >
              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveItem = group.items.some((item) => location.pathname === item.path);
                const isContentGroup = group.id === 'content';

                return (
                  <AccordionItem key={group.id} value={group.id} className="border-none">
                    <AccordionTrigger 
                      className="px-4 py-2.5 hover:no-underline rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <GroupIcon
                          className={`h-5 w-5 flex-shrink-0 ${
                            hasActiveItem ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className={`font-medium text-sm ${
                          hasActiveItem ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {group.label}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pt-1">
                      <ul className="space-y-0.5 ml-8" role="list">
                        {renderMenuItems(group.items, showLabels)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </nav>
      </>
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
            <Bars3Icon className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <div className="p-6">
            <SidebarContent collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex bg-white dark:bg-gray-900 shadow-md min-h-screen fixed left-0 top-0 flex-col z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isCollapsed ? 'px-3 py-6' : 'p-6'}`}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>
    </>
  );
};

export default AdminSidebar;

