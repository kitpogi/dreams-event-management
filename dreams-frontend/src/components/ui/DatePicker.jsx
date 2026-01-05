import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * DatePicker - Date picker component using shadcn/ui Calendar
 * 
 * @param {Object} props
 * @param {Date} props.value - Selected date
 * @param {Function} props.onChange - Callback when date changes
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {String} props.placeholder - Placeholder text
 * @param {String} props.className - Additional CSS classes
 * @param {Boolean} props.disabled - Disable picker
 * @param {String} props.dateFormat - Date format string (default: 'PPP')
 */
const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  dateFormat = 'PPP',
  error,
  label,
  description,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, dateFormat) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default DatePicker;

