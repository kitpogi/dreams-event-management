import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Inbox, Package, Search, FileX } from 'lucide-react';

/**
 * EmptyState component for displaying empty states
 * @param {Object} props
 * @param {ReactNode} props.icon - Custom icon component
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {ReactNode} props.children - Additional content
 * @param {string} props.variant - Variant: 'default' | 'search' | 'package' | 'file'
 * @param {Object} props.action - Action button config: { label, onClick, variant }
 * @param {string} props.className - Additional CSS classes
 */
export const EmptyState = ({
  icon,
  title = 'No items found',
  description,
  children,
  variant = 'default',
  action,
  className,
}) => {
  const defaultIcons = {
    default: Inbox,
    search: Search,
    package: Package,
    file: FileX,
  };

  const IconComponent = icon || defaultIcons[variant] || Inbox;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {children && <div className="mb-6">{children}</div>}
      
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          {...action.props}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

