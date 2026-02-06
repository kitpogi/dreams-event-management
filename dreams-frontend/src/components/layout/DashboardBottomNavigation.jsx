import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Package, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bottom navigation for client dashboard - shown only on mobile
 * Provides quick access to the most important dashboard sections
 */
const DashboardBottomNavigation = () => {
  const location = useLocation();

  // Key dashboard navigation items for mobile
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/dashboard/bookings', label: 'Bookings', icon: BookOpen },
    { to: '/dashboard/packages', label: 'Packages', icon: Package },
    { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    { to: '/profile/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg lg:hidden safe-area-bottom"
      role="navigation"
      aria-label="Dashboard navigation"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 touch-manipulation',
                active
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                active && 'bg-purple-100 dark:bg-purple-900/30'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardBottomNavigation;
