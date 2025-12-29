import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const Breadcrumb = ({
  items,
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true,
  className,
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from location if items not provided
  const breadcrumbItems = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [];
    
    if (showHome) {
      crumbs.push({ label: 'Home', to: '/' });
    }
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      crumbs.push({
        label,
        to: currentPath,
        isLast: index === paths.length - 1,
      });
    });
    
    return crumbs;
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1" role="list">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isHome = item.to === '/' && showHome;

          return (
            <li key={item.to || index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400 dark:text-gray-500" aria-hidden="true">
                  {separator}
                </span>
              )}
              {isLast ? (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {isHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1 text-gray-600 dark:text-gray-400',
                    'hover:text-gray-900 dark:hover:text-gray-100',
                    'transition-colors duration-200'
                  )}
                >
                  {isHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

