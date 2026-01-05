import { cloneElement } from 'react';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './form';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormFieldWrapper - Enhanced form field wrapper with visual validation feedback
 * 
 * @param {Object} props
 * @param {String} props.label - Field label
 * @param {String} props.description - Field description
 * @param {ReactNode} props.children - Form control element
 * @param {Boolean} props.showSuccess - Show success indicator
 * @param {String} props.error - Error message
 * @param {String} props.successMessage - Success message
 * @param {String} props.className - Additional CSS classes
 */
const FormFieldWrapper = ({
  label,
  description,
  children,
  showSuccess = false,
  error,
  successMessage,
  className,
  required,
}) => {
  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError;

  return (
    <FormItem className={cn('space-y-2', className)}>
      {label && (
        <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-destructive')}>
          {label}
        </FormLabel>
      )}
      
      <div className="relative">
        <FormControl>
          {cloneElement(children, {
            className: cn(
              children.props.className,
              hasError && 'border-destructive focus-visible:ring-destructive',
              hasSuccess && 'border-success-500 focus-visible:ring-success-500'
            ),
          })}
        </FormControl>
        
        {/* Success indicator */}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle2 className="h-5 w-5 text-success-500" />
          </div>
        )}
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
        )}
      </div>

      {description && !hasError && !hasSuccess && (
        <FormDescription>{description}</FormDescription>
      )}
      
      {successMessage && hasSuccess && (
        <p className="text-sm text-success-600 dark:text-success-400 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </p>
      )}
      
      {hasError && <FormMessage />}
    </FormItem>
  );
};

export default FormFieldWrapper;

