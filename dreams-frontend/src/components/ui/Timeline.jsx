import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';
import { Badge } from './badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ClockIcon,
  AlertCircle,
} from 'lucide-react';

const Timeline = ({
  items = [],
  orientation = 'vertical',
  className,
  showDate = true,
  showTime = true,
  itemClassName,
}) => {
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'confirmed':
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-error-600 dark:text-error-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-600 dark:text-muted-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const variants = {
      confirmed: 'bg-success-100 text-success-800 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800',
      approved: 'bg-success-100 text-success-800 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800',
      completed: 'bg-info-100 text-info-800 border-info-200 dark:bg-info-900/30 dark:text-info-400 dark:border-info-800',
      pending: 'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800',
      processing: 'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800',
      cancelled: 'bg-error-100 text-error-800 border-error-200 dark:bg-error-900/30 dark:text-error-400 dark:border-error-800',
      rejected: 'bg-error-100 text-error-800 border-error-200 dark:bg-error-900/30 dark:text-error-400 dark:border-error-800',
    };
    return (
      <Badge 
        variant="outline" 
        className={variants[statusLower] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}
      >
        {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
        {items.map((item, index) => (
          <Card key={item.id || index} className={cn('min-w-[280px] flex-shrink-0', itemClassName)}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon || getStatusIcon(item.status)}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                  </div>
                  {item.status && getStatusBadge(item.status)}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                  {showDate && item.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.date)}</span>
                      {showTime && item.date && (
                        <span className="ml-1">• {formatTime(item.date)}</span>
                      )}
                    </div>
                  )}
                  {item.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{item.venue}</span>
                    </div>
                  )}
                  {item.guests && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{item.guests} guests</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical Timeline */}
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id || index} className="relative flex gap-4">
            {/* Timeline Line */}
            {index < items.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            )}
            
            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                {item.icon || getStatusIcon(item.status)}
              </div>
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-6', itemClassName)}>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      {item.status && getStatusBadge(item.status)}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500">
                      {showDate && item.date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.date)}</span>
                          {showTime && item.date && (
                            <>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>{formatTime(item.date)}</span>
                            </>
                          )}
                        </div>
                      )}
                      {item.venue && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{item.venue}</span>
                        </div>
                      )}
                      {item.guests && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{item.guests} guests</span>
                        </div>
                      )}
                    </div>

                    {item.metadata && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;

