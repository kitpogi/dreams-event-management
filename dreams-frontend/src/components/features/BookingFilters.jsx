import { Filter, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const BookingFilters = ({
    statusFilter,
    paymentFilter,
    onStatusChange,
    onPaymentChange,
    onClearFilters
}) => {
    const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all';

    return (
        <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            Status:
                        </label>
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            Payment:
                        </label>
                        <Select value={paymentFilter} onValueChange={onPaymentChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Payments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payments</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                            className="ml-auto"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default BookingFilters;
