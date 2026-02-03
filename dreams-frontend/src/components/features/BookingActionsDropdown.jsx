import { MoreVertical, Eye, CreditCard, X, DollarSign } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

const BookingActionsDropdown = ({
    booking,
    onViewDetails,
    onPayNow,
    onCancel,
    onViewPayments,
    canShowPayButton,
    canCancelBooking,
}) => {
    const hasActions = canShowPayButton(booking) || canCancelBooking(booking) || onViewDetails || onViewPayments;

    if (!hasActions) {
        return (
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {(booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled' && 'Cancelled'}
                {(booking?.booking_status || booking?.status || '').toLowerCase() === 'completed' && 'Completed'}
            </span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(booking)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                )}
                {onViewPayments && (
                    <DropdownMenuItem onClick={() => onViewPayments(booking)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        View Payments
                    </DropdownMenuItem>
                )}
                {canShowPayButton(booking) && onPayNow && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onPayNow(booking)}
                            className="text-primary-600 dark:text-primary-400"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now
                        </DropdownMenuItem>
                    </>
                )}
                {canCancelBooking(booking) && onCancel && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onCancel(booking)}
                            className="text-red-600 dark:text-red-400"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Booking
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default BookingActionsDropdown;
