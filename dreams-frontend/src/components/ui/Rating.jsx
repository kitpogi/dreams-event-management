import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Rating component for displaying and inputting ratings
 * @param {Object} props
 * @param {number} props.value - Current rating value (0-5)
 * @param {Function} props.onChange - Callback when rating changes: (rating: number) => void
 * @param {boolean} props.readOnly - Make rating read-only
 * @param {number} props.max - Maximum rating (default: 5)
 * @param {number} props.size - Size of stars in pixels (default: 20)
 * @param {boolean} props.showValue - Show numeric value
 * @param {string} props.className - Additional CSS classes
 */
export const Rating = ({
  value = 0,
  onChange,
  readOnly = false,
  max = 5,
  size = 20,
  showValue = false,
  className,
  ...props
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const rating = index + 1;
          const isFilled = rating <= displayValue;
          
          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={cn(
                'transition-colors',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
              aria-label={`Rate ${rating} out of ${max}`}
            >
              <Star
                style={{ width: size, height: size }}
                className={cn(
                  isFilled
                    ? 'fill-warning-400 text-warning-400'
                    : 'fill-none text-muted-foreground'
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {value > 0 ? value.toFixed(1) : 'Not rated'}
        </span>
      )}
    </div>
  );
};

export default Rating;

