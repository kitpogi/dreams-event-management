import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '@/lib/utils';

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  link,
  linkText,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-card border-border',
    primary: 'bg-gradient-to-br from-brand-primary-500 to-brand-secondary-500 text-white border-transparent',
    success: 'bg-gradient-to-br from-success-500 to-success-600 text-white border-transparent',
    warning: 'bg-gradient-to-br from-warning-500 to-warning-600 text-white border-transparent',
    danger: 'bg-gradient-to-br from-error-500 to-error-600 text-white border-transparent',
  };

  const iconVariants = {
    default: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    primary: 'bg-white/20 text-white',
    success: 'bg-white/20 text-white',
    warning: 'bg-white/20 text-white',
    danger: 'bg-white/20 text-white',
  };

  const isGradient = variant !== 'default';
  const textColor = isGradient ? 'text-white' : 'text-foreground';
  const secondaryTextColor = isGradient ? 'text-white/80' : 'text-muted-foreground';

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', variants[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn('text-sm font-medium uppercase tracking-wide', secondaryTextColor)}>
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn('inline-flex items-center justify-center h-10 w-10 rounded-full', iconVariants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className={cn('text-3xl font-bold', textColor)}>{value}</p>
            {trend && trendValue && (
              <span
                className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
          </div>
          {description && (
            <p className={cn('text-sm', secondaryTextColor)}>{description}</p>
          )}
          {link && linkText && (
            <Link
              to={link}
              className={cn(
                'inline-flex items-center text-sm font-medium transition-colors hover:underline',
                isGradient ? 'text-white/90 hover:text-white' : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              )}
            >
              {linkText} →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

