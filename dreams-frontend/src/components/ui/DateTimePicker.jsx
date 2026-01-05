import { useState } from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './Input';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * DateTimePicker - Combined date and time picker component
 * 
 * @param {Object} props
 * @param {Date|String} props.value - Selected date and time
 * @param {Function} props.onChange - Callback when date/time changes
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {String} props.placeholder - Placeholder text
 * @param {String} props.className - Additional CSS classes
 * @param {Boolean} props.disabled - Disable picker
 * @param {String} props.dateFormat - Date format string (default: 'PPP')
 */
const DateTimePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Pick a date and time',
  className,
  disabled = false,
  dateFormat = 'PPP',
  error,
  label,
  description,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      return value instanceof Date ? value : new Date(value);
    }
    return null;
  });
  const [timeValue, setTimeValue] = useState(() => {
    if (value) {
      const date = value instanceof Date ? value : new Date(value);
      return format(date, 'HH:mm');
    }
    return '00:00';
  });

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      
      // Combine date and time
      if (timeValue) {
        const [hours, minutes] = timeValue.split(':');
        const combined = new Date(date);
        combined.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        onChange?.(combined);
      } else {
        onChange?.(date);
      }
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const combined = new Date(selectedDate);
      combined.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      onChange?.(combined);
    }
  };

  const displayValue = selectedDate
    ? `${format(selectedDate, dateFormat)} ${timeValue}`
    : placeholder;

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
              !selectedDate && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
            />
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
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

export default DateTimePicker;

