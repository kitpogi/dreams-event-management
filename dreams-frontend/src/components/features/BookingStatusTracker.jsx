import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const statusSteps = [
  { id: 'pending', label: 'Pending', description: 'Booking submitted' },
  { id: 'confirmed', label: 'Confirmed', description: 'Booking confirmed' },
  { id: 'in_progress', label: 'In Progress', description: 'Event preparation' },
  { id: 'completed', label: 'Completed', description: 'Event finished' },
  { id: 'cancelled', label: 'Cancelled', description: 'Booking cancelled' },
];

const getStatusIndex = (status) => {
  const normalizedStatus = status?.toLowerCase().replace(' ', '_');
  const index = statusSteps.findIndex(step => step.id === normalizedStatus);
  return index >= 0 ? index : 0;
};

const getStatusColor = (status, isActive, isCompleted) => {
  const normalizedStatus = status?.toLowerCase().replace(' ', '_');
  
  if (normalizedStatus === 'cancelled') {
    return {
      icon: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-300 dark:border-red-700',
      line: 'bg-red-300 dark:bg-red-700',
    };
  }
  
  if (isCompleted) {
    return {
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-300 dark:border-green-700',
      line: 'bg-green-500 dark:bg-green-500',
    };
  }
  
  if (isActive) {
    return {
      icon: 'text-[#a413ec] dark:text-[#7c3aed]',
      bg: 'bg-[#a413ec]/10 dark:bg-[#7c3aed]/20',
      border: 'border-[#a413ec] dark:border-[#7c3aed]',
      line: 'bg-[#a413ec] dark:bg-[#7c3aed]',
    };
  }
  
  return {
    icon: 'text-gray-400 dark:text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-700',
    line: 'bg-gray-300 dark:bg-gray-700',
  };
};

const BookingStatusTracker = ({ status = 'pending', className }) => {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status?.toLowerCase().replace(' ', '_') === 'cancelled';

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          {statusSteps.slice(0, -1).map((step, index) => {
            const stepIndex = getStatusIndex(step.id);
            const isCompleted = stepIndex <= currentIndex && !isCancelled;
            const colors = getStatusColor(step.id, stepIndex === currentIndex, isCompleted);
            
            return (
              <div
                key={step.id}
                className={cn(
                  'absolute h-full transition-all duration-500',
                  colors.line,
                  isCompleted ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                  left: `${(index / (statusSteps.length - 1)) * 100}%`,
                  width: `${(1 / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            );
          })}
        </div>

        {/* Status Steps */}
        <div className="flex justify-between relative z-10">
          {statusSteps.map((step, index) => {
            const stepIndex = getStatusIndex(step.id);
            const isActive = stepIndex === currentIndex;
            const isCompleted = stepIndex < currentIndex && !isCancelled;
            const isCancelledStep = step.id === 'cancelled' && isCancelled;
            const colors = getStatusColor(step.id, isActive, isCompleted || isCancelledStep);

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-lg',
                    colors.bg,
                    colors.border,
                    isActive && 'ring-4 ring-[#a413ec]/20 dark:ring-[#7c3aed]/20 scale-110',
                    isCompleted && 'scale-105'
                  )}
                >
                  {isCancelledStep ? (
                    <XCircle className={cn('h-6 w-6', colors.icon)} />
                  ) : isCompleted ? (
                    <CheckCircle2 className={cn('h-6 w-6', colors.icon)} />
                  ) : isActive ? (
                    <Clock className={cn('h-6 w-6', colors.icon)} />
                  ) : (
                    <Circle className={cn('h-6 w-6', colors.icon)} />
                  )}
                </div>
                <div className="mt-3 text-center max-w-[120px]">
                  <p
                    className={cn(
                      'text-xs font-semibold transition-colors',
                      isActive || isCompleted || isCancelledStep
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5',
                      isActive || isCompleted || isCancelledStep
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingStatusTracker;

