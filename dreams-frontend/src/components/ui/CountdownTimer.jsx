import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

/**
 * CountdownTimer component for displaying countdown timers
 * @param {Object} props
 * @param {Date|string|number} props.targetDate - Target date for countdown
 * @param {Function} props.onComplete - Callback when countdown completes
 * @param {string} props.format - Display format: 'full' | 'compact' | 'minimal'
 * @param {boolean} props.showIcon - Show clock icon
 * @param {string} props.className - Additional CSS classes
 */
export const CountdownTimer = ({
  targetDate,
  onComplete,
  format = 'full',
  showIcon = true,
  className,
  ...props
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) {
          onComplete();
        }
        return;
      }

      setIsComplete(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)} {...props}>
        {showIcon && <Clock className="h-4 w-4" />}
        <span>Time's up!</span>
      </div>
    );
  }

  const renderTimeUnit = (value, label) => {
    if (format === 'minimal') {
      return (
        <span className="font-mono text-lg font-semibold">
          {String(value).padStart(2, '0')}
        </span>
      );
    }

    if (format === 'compact') {
      return (
        <div className="flex flex-col items-center">
          <span className="font-mono text-xl font-bold">{String(value).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      );
    }

    // Full format
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-2xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
      </div>
    );
  };

  return (
    <div className={cn('flex items-center gap-4', className)} {...props}>
      {showIcon && <Clock className="h-5 w-5 text-muted-foreground" />}
      
      <div className="flex items-center gap-3">
        {timeLeft.days > 0 && renderTimeUnit(timeLeft.days, 'Days')}
        {renderTimeUnit(timeLeft.hours, 'Hours')}
        {renderTimeUnit(timeLeft.minutes, 'Minutes')}
        {format !== 'minimal' && renderTimeUnit(timeLeft.seconds, 'Seconds')}
      </div>
    </div>
  );
};

export default CountdownTimer;

