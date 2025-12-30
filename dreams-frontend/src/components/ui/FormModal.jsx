import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { cn } from '@/lib/utils';

/**
 * FormModal - A backward-compatible wrapper around shadcn/ui Dialog
 * Maintains the same API as the original FormModal for easy migration
 */
const FormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          'dark:bg-gray-900 dark:border-gray-800'
        )}
        onInteractOutside={(e) => {
          // Allow closing on outside click
          onClose();
        }}
      >
        <DialogHeader className={showCloseButton ? 'pr-8' : ''}>
          <DialogTitle className={cn(
            "text-xl font-bold dark:text-gray-100",
            !title && "sr-only"
          )}>
            {title || "Dialog"}
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          'mt-4',
          !title && !showCloseButton && 'mt-0'
        )}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormModal;

