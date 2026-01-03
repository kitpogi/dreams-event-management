import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Input } from './Input';

/**
 * TagInput component for inputting tags
 * @param {Object} props
 * @param {Array<string>} props.value - Array of tag values
 * @param {Function} props.onChange - Callback when tags change: (tags: string[]) => void
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disable input
 * @param {number} props.maxTags - Maximum number of tags allowed
 * @param {Function} props.onValidate - Validation function: (tag: string) => boolean
 */
export const TagInput = ({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  className,
  disabled = false,
  maxTags,
  onValidate,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) return;
    
    // Check if tag already exists
    if (value.includes(trimmedTag)) {
      setInputValue('');
      return;
    }
    
    // Validate tag if validator provided
    if (onValidate && !onValidate(trimmedTag)) {
      return;
    }
    
    // Check max tags
    if (maxTags && value.length >= maxTags) {
      return;
    }
    
    const newTags = [...value, trimmedTag];
    onChange?.(newTags);
    setInputValue('');
  };

  const removeTag = (tagToRemove) => {
    const newTags = value.filter((tag) => tag !== tagToRemove);
    onChange?.(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled || (maxTags && value.length >= maxTags)}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
};

export default TagInput;

