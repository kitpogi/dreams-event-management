import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

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
  // Argon-style variants using your brand colors
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300',
    primary: 'bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white border-transparent shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden',
    success: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-transparent shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden',
    warning: 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-transparent shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden',
    danger: 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-transparent shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden',
  };

  const iconVariants = {
    default: 'bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white shadow-lg',
    primary: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
    success: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
    warning: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
    danger: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
  };

  const isGradient = variant !== 'default';
  const textColor = isGradient ? 'text-white' : 'text-gray-900 dark:text-white';
  const secondaryTextColor = isGradient ? 'text-white/95' : 'text-gray-700 dark:text-gray-300';

  return (
    <Card className={cn('group hover:-translate-y-1 transition-all duration-300', variants[variant], className)}>
      {/* Background decorative circles for gradient cards */}
      {isGradient && (
        <>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
        </>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className={cn('text-xs font-semibold uppercase tracking-wider', secondaryTextColor)}>
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            'inline-flex items-center justify-center h-12 w-12 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
            iconVariants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <p className={cn('text-4xl font-extrabold tracking-tight', textColor)}>{value}</p>
            {trend && trendValue && (
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded-full',
                  isGradient
                    ? trend === 'up' 
                      ? 'bg-green-500/30 text-white border border-green-400/50' 
                      : 'bg-red-500/30 text-white border border-red-400/50'
                    : trend === 'up' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
          </div>
          {description && (
            <p className={cn('text-sm font-medium', secondaryTextColor)}>{description}</p>
          )}
          {link && linkText && (
            <Link
              to={link}
              className={cn(
                'inline-flex items-center gap-1 text-sm font-semibold transition-all duration-300 group/link',
                isGradient 
                  ? 'text-white/90 hover:text-white hover:gap-2' 
                  : 'text-[#5A45F2] dark:text-[#7ee5ff] hover:text-[#7c3aed] dark:hover:text-[#7ee5ff]'
              )}
            >
              {linkText}
              <ArrowRight className={cn(
                'w-4 h-4 transition-transform duration-300',
                isGradient ? 'group-hover/link:translate-x-1' : 'group-hover/link:translate-x-1'
              )} />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

