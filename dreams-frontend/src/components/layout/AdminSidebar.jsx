import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon, group: 'main' },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon, group: 'main' },
  ];

  const menuGroups = [
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarDaysIcon,
      items: [
        { path: '/admin/bookings', label: 'Manage Bookings', icon: CalendarDaysIcon },
        { path: '/admin/bookings/calendar', label: 'Bookings Calendar', icon: CalendarDaysIcon },
      ],
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: CubeIcon,
      items: [
        { path: '/admin/packages', label: 'Manage Packages', icon: CubeIcon },
        { path: '/admin/venues', label: 'Manage Venues', icon: BuildingOfficeIcon },
        { path: '/admin/portfolio', label: 'Portfolio', icon: PhotoIcon },
        { path: '/admin/testimonials', label: 'Testimonials', icon: ChatBubbleLeftRightIcon },
      ],
    },
    {
      id: 'users',
      label: 'Users & Communication',
      icon: UsersIcon,
      items: [
        { path: '/admin/clients', label: 'Manage Clients', icon: UsersIcon },
        { path: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: EnvelopeIcon },
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

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
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

  const renderMenuItems = (items) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <li key={item.path} role="listitem">
          <Link
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isActive
                ? 'bg-primary-600 text-primary-foreground'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />
            <span className="font-medium">{item.label}</span>
          </Link>
        </li>
      );
    });
  };

  const SidebarContent = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Dreams Events</p>
      </div>
      <nav className="flex-1" aria-label="Admin navigation">
        <ul className="space-y-2" role="list">
          {renderMenuItems(menuItems)}
        </ul>

        <Accordion type="multiple" className="mt-4" defaultValue={['bookings', 'content']}>
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const hasActiveItem = group.items.some((item) => location.pathname === item.path);

            return (
              <AccordionItem key={group.id} value={group.id} className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <GroupIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        hasActiveItem ? 'text-primary-600 dark:text-primary-400' : 'text-muted-foreground'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={`font-medium ${
                      hasActiveItem ? 'text-primary-600 dark:text-primary-400' : 'text-foreground'
                    }`}>
                      {group.label}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <ul className="space-y-1 ml-7" role="list">
                    {renderMenuItems(group.items)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
      
      {/* User info and logout */}
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
          aria-label="Logout from admin panel"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

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
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-64 bg-white dark:bg-gray-900 shadow-md min-h-screen p-6 fixed left-0 top-0 flex-col z-40"
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;

