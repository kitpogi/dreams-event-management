import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { bookingService } from '../../api/services/bookingService';

const BookingCancellationModal = ({ 
  isOpen, 
  onClose, 
  booking,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleCancel = async () => {
    if (loading || !booking) return;

    setLoading(true);
    try {
      await bookingService.cancel(booking.booking_id || booking.id, reason || null);
      
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully. You will receive a confirmation email shortly.',
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setReason('');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPackageName = (booking) => {
    if (!booking) return 'Event Package';
    if (booking.eventPackage) {
      return booking.eventPackage.package_name || booking.eventPackage.name;
    }
    return booking.package_name || 'Event Package';
  };

  const getEventDate = (booking) => {
    if (!booking || !booking.event_date) return 'N/A';
    return new Date(booking.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Don't render if booking is not available
  if (!booking) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left text-xl font-bold">
                Cancel Booking
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left mt-2 text-base">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">Package:</span>{' '}
              <span className="text-gray-900 dark:text-white">{getPackageName(booking)}</span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">Event Date:</span>{' '}
              <span className="text-gray-900 dark:text-white">{getEventDate(booking)}</span>
            </div>
            {booking.event_venue && (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Venue:</span>{' '}
                <span className="text-gray-900 dark:text-white">{booking.event_venue}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation_reason" className="text-sm font-medium">
              Cancellation Reason <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
            </Label>
            <Textarea
              id="cancellation_reason"
              placeholder="Please let us know why you're cancelling this booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> Bookings cannot be cancelled less than 7 days before the event date. 
              If your event is within 7 days, please contact support for assistance.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Keep Booking
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BookingCancellationModal;

