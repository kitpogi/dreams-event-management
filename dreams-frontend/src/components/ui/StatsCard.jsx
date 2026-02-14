import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({
  title,
  value,
  unit,
  trend,
  trendDirection = 'up',
  status,
  icon: Icon,
  color = 'blue',
  className,
}) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/10',
      iconText: 'text-blue-600 dark:text-blue-400',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/10',
      iconText: 'text-cyan-600 dark:text-cyan-400',
    },
    green: {
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      iconText: 'text-emerald-600 dark:text-emerald-400',
    },
    orange: {
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/10',
      iconText: 'text-orange-600 dark:text-orange-400',
    }
  };

  const activeColor = colorMap[color] || colorMap.blue;

  return (
    <Card className={cn(
      'relative overflow-hidden group border-none transition-all duration-300 hover:-translate-y-1',
      'bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl',
      className
    )}>
      <CardContent className="p-8">
        {/* Top Section: Icon and Trend */}
        <div className="flex items-center justify-between mb-8">
          <div className={cn(
            'p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-inner',
            'bg-slate-800/50 dark:bg-slate-800/50',
            activeColor.iconText
          )}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>

          {(trend || status) && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-black italic tracking-tighter transition-transform duration-300 group-hover:translate-x-1',
              trendDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend || status}</span>
            </div>
          )}
        </div>

        {/* Value Section */}
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm group-hover:scale-[1.02] transform origin-left transition-transform duration-300">
            {value}
          </h2>
          {unit && (
            <span className="text-lg font-bold text-gray-500/80 uppercase tracking-widest text-xs">
              {unit}
            </span>
          )}
        </div>

        {/* Title Section */}
        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-wide">
          {title}
        </p>

        {/* Decorative Glow */}
        <div className={cn(
          "absolute -bottom-12 -right-12 w-32 h-32 blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 rounded-full",
          color === 'blue' && "bg-blue-500",
          color === 'cyan' && "bg-cyan-500",
          color === 'green' && "bg-emerald-500",
          color === 'orange' && "bg-orange-500"
        )}></div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

