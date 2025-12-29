import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Input } from './Input';
import { cn } from '@/lib/utils';

/**
 * TimePicker - Time picker component
 * 
 * @param {Object} props
 * @param {String} props.value - Selected time (HH:mm format)
 * @param {Function} props.onChange - Callback when time changes
 * @param {String} props.placeholder - Placeholder text
 * @param {String} props.className - Additional CSS classes
 * @param {Boolean} props.disabled - Disable picker
 * @param {String} props.minTime - Minimum selectable time (HH:mm)
 * @param {String} props.maxTime - Maximum selectable time (HH:mm)
 */
const TimePicker = ({
  value,
  onChange,
  placeholder = 'Select time',
  className,
  disabled = false,
  minTime,
  maxTime,
  error,
  label,
  description,
  step = 60, // minutes
}) => {
  const [timeValue, setTimeValue] = useState(value || '');

  const handleChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (onChange) {
      onChange(newTime);
    }
  };

  const validateTime = (time) => {
    if (!time) return true;

    if (minTime && time < minTime) {
      return false;
    }

    if (maxTime && time > maxTime) {
      return false;
    }

    return true;
  };

  const isValid = !timeValue || validateTime(timeValue);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div className="relative">
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="time"
          value={timeValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          min={minTime}
          max={maxTime}
          step={step}
          className={cn(
            'pl-10',
            error && 'border-destructive',
            !isValid && 'border-destructive'
          )}
        />
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {(error || !isValid) && (
        <p className="text-sm text-destructive">
          {error || (!isValid && 'Time is outside the allowed range')}
        </p>
      )}
    </div>
  );
};

export default TimePicker;

