import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  variant = 'danger',
  icon: CustomIcon,
  className
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      buttonVariant: 'destructive',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      buttonVariant: 'default',
      buttonClassName: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      buttonVariant: 'default',
      buttonClassName: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-50 dark:bg-green-900/20',
      buttonVariant: 'default',
      buttonClassName: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const config = variantConfig[variant] || variantConfig.danger;
  const IconComponent = CustomIcon || config.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={cn('sm:max-w-md', className)}>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {IconComponent && (
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                config.iconBg
              )}>
                <IconComponent className={cn('w-5 h-5', config.iconColor)} />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle className="text-left text-xl font-bold">
                {title}
              </AlertDialogTitle>
              {message && (
                <AlertDialogDescription className="text-left mt-2 text-base">
                  {message}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={config.buttonVariant}
              className={config.buttonClassName}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;

