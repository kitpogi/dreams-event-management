import { Badge, badgeVariants } from './badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

/**
 * StatusBadge component for displaying status indicators
 * @param {Object} props
 * @param {string} props.status - Status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading'
 * @param {string} props.label - Custom label text
 * @param {boolean} props.showIcon - Show status icon
 * @param {string} props.className - Additional CSS classes
 */
export const StatusBadge = ({
  status = 'info',
  label,
  showIcon = true,
  className,
  ...props
}) => {
  const statusConfig = {
    success: {
      label: label || 'Success',
      icon: CheckCircle2,
      className: 'bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20',
    },
    error: {
      label: label || 'Error',
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    warning: {
      label: label || 'Warning',
      icon: AlertCircle,
      className: 'bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20',
    },
    info: {
      label: label || 'Info',
      icon: AlertCircle,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    pending: {
      label: label || 'Pending',
      icon: Clock,
      className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    },
    loading: {
      label: label || 'Loading',
      icon: Loader2,
      className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    },
  };

  const config = statusConfig[status] || statusConfig.info;
  const IconComponent = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5',
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && (
        <IconComponent
          className={cn(
            'h-3 w-3',
            status === 'loading' && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;

