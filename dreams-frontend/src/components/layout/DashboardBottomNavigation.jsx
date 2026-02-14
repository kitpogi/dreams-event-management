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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-lg lg:hidden safe-area-bottom px-4"
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
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                active && 'bg-blue-100 dark:bg-blue-900/30'
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
