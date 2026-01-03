import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorState component for displaying error states
 * @param {Object} props
 * @param {ReactNode} props.icon - Custom icon component
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {ReactNode} props.children - Additional content
 * @param {Object} props.retry - Retry button config: { label, onClick }
 * @param {Object} props.home - Home button config: { label, onClick }
 * @param {string} props.className - Additional CSS classes
 */
export const ErrorState = ({
  icon,
  title = 'Something went wrong',
  description = 'An error occurred while loading this content. Please try again.',
  children,
  retry,
  home,
  className,
}) => {
  const IconComponent = icon || AlertCircle;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <IconComponent className="h-8 w-8 text-destructive" />
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
      
      <div className="flex gap-3">
        {retry && (
          <Button
            variant="default"
            onClick={retry.onClick}
            {...retry.props}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retry.label || 'Try Again'}
          </Button>
        )}
        
        {home && (
          <Button
            variant="outline"
            onClick={home.onClick}
            {...home.props}
          >
            <Home className="mr-2 h-4 w-4" />
            {home.label || 'Go Home'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

