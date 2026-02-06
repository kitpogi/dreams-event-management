import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified LoadingSpinner component used across the entire application.
 * 
 * @param {'sm'|'md'|'lg'|'xl'} size - Spinner size
 * @param {'page'|'section'|'inline'} variant - Layout variant
 * @param {string} text - Optional loading text displayed below the spinner
 * @param {string} className - Additional CSS classes
 */
const LoadingSpinner = ({ size = 'md', variant = 'inline', text, className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  };

  const variantClasses = {
    page: 'flex flex-col items-center justify-center min-h-[60vh]',
    section: 'flex flex-col items-center justify-center py-12',
    inline: 'flex items-center justify-center',
  };

  return (
    <div className={cn(variantClasses[variant] || variantClasses.inline, className)}>
      <Loader2 className={cn(sizeClasses[size] || sizeClasses.md, 'animate-spin text-primary')} />
      {text && (
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

