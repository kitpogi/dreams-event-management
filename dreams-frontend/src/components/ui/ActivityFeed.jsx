import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { 
  Clock, 
  User, 
  Package, 
  Calendar, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Bell,
} from 'lucide-react';

const ActivityFeed = ({
  activities = [],
  maxItems,
  showAvatar = true,
  showTimestamp = true,
  compact = false,
  className,
  onActivityClick,
}) => {
  const getActivityIcon = (type) => {
    const typeLower = type?.toLowerCase() || '';
    const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (typeLower) {
      case 'booking':
      case 'reservation':
        return <Calendar className={cn(iconClass, 'text-info-600 dark:text-info-400')} />;
      case 'package':
      case 'service':
        return <Package className={cn(iconClass, 'text-primary-600 dark:text-primary-400')} />;
      case 'message':
      case 'comment':
        return <MessageSquare className={cn(iconClass, 'text-success-600 dark:text-success-400')} />;
      case 'status':
      case 'update':
        return <Info className={cn(iconClass, 'text-warning-600 dark:text-warning-400')} />;
      case 'success':
      case 'completed':
        return <CheckCircle2 className={cn(iconClass, 'text-success-600 dark:text-success-400')} />;
      case 'error':
      case 'failed':
        return <XCircle className={cn(iconClass, 'text-error-600 dark:text-error-400')} />;
      case 'notification':
      case 'alert':
        return <Bell className={cn(iconClass, 'text-warning-600 dark:text-warning-400')} />;
      default:
        return <AlertCircle className={cn(iconClass, 'text-muted-600 dark:text-muted-400')} />;
    }
  };

  const getActivityColor = (type) => {
    const typeLower = type?.toLowerCase() || '';
    switch (typeLower) {
      case 'booking':
      case 'reservation':
        return 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800';
      case 'package':
      case 'service':
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
      case 'message':
      case 'comment':
        return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800';
      case 'status':
      case 'update':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
      case 'success':
      case 'completed':
        return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800';
      case 'error':
      case 'failed':
        return 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800';
      case 'notification':
      case 'alert':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
      default:
        return 'bg-muted-50 dark:bg-muted-900/50 border-muted-200 dark:border-muted-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No activities to display
          </div>
        ) : (
          displayActivities.map((activity, index) => (
            <div
              key={activity.id || index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                getActivityColor(activity.type),
                onActivityClick && 'cursor-pointer hover:shadow-sm',
                className
              )}
              onClick={() => onActivityClick?.(activity)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {showAvatar && activity.user ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800">
                    {getActivityIcon(activity.type)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message || activity.title}
                </p>
                {showTimestamp && activity.timestamp && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                )}
              </div>
              {activity.badge && (
                <Badge variant="outline" className="text-xs">
                  {activity.badge}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayActivities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No activities to display</p>
          </CardContent>
        </Card>
      ) : (
        displayActivities.map((activity, index) => (
          <Card
            key={activity.id || index}
            className={cn(
              'border transition-all',
              getActivityColor(activity.type),
              onActivityClick && 'cursor-pointer hover:shadow-md'
            )}
            onClick={() => onActivityClick?.(activity)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  {showAvatar && activity.user ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                      <AvatarFallback>
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {activity.user && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {activity.user.name}
                          </span>
                          {activity.type && (
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {activity.message || activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {activity.badge && (
                      <Badge variant="outline">{activity.badge}</Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  {(activity.metadata || showTimestamp) && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {showTimestamp && activity.timestamp && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                      )}
                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ActivityFeed;

