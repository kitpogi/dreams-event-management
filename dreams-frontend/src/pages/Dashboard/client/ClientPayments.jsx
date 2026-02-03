import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { getBookingPayments } from '../../../api/services/paymentService';
import { Card, Button, Badge, Skeleton } from '../../../components/ui';
import { useToast } from '../../../hooks/use-toast';
import { CreditCard, DollarSign, Calendar, FileText, ArrowRight, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import PaymentForm from '../../../components/features/PaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui';

const ClientPayments = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingPayments, setBookingPayments] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookings');
            const bookingsData = response.data.data || response.data || [];
            setBookings(bookingsData);

            // Fetch payments for all bookings
            for (const booking of bookingsData) {
                const bookingId = booking.booking_id || booking.id;
                if (bookingId) {
                    fetchBookingPayments(bookingId);
                }
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingPayments = async (bookingId) => {
        if (bookingPayments[bookingId]) return bookingPayments[bookingId];
        try {
            const response = await getBookingPayments(bookingId);
            const payments = response.data || response || [];
            setBookingPayments(prev => ({ ...prev, [bookingId]: payments }));
            return payments;
        } catch (error) {
            console.error('Error fetching payments:', error);
            return [];
        }
    };

    const getPaymentInfo = (booking) => {
        const payments = bookingPayments[booking.booking_id || booking.id] || [];
        const totalPaid = payments
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        const packagePrice = booking?.eventPackage?.package_price ||
            booking?.event_package?.package_price ||
            booking?.eventPackage?.price ||
            booking?.event_package?.price ||
            booking?.package?.package_price ||
            booking?.package?.price ||
            booking?.package_price ||
            booking?.price ||
            0;

        const totalAmount = parseFloat(booking?.total_amount || packagePrice || 0);
        const remainingBalance = Math.max(0, totalAmount - totalPaid);
        const paymentStatus = booking?.payment_status || 'unpaid';

        return { totalPaid, totalAmount, remainingBalance, paymentStatus, payments };
    };

    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
            partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
            paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
            refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
        };
        const config = statusConfig[status] || statusConfig.unpaid;
        const Icon = config.icon;
        return (
            <Badge className={config.className}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getPackageName = (booking) => {
        return booking?.eventPackage?.package_name ||
            booking?.event_package?.package_name ||
            booking?.package?.name ||
            booking?.package?.package_name ||
            'N/A';
    };

    const handlePayNow = async (booking) => {
        const bookingId = booking.booking_id || booking.id;
        await fetchBookingPayments(bookingId);
        setSelectedBookingForPayment(booking);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
        toast({
            title: 'Payment Successful!',
            description: 'Your payment has been processed successfully.',
        });
        setBookingPayments({});
        await fetchBookings();
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
    };

    const canShowPayButton = (booking) => {
        const { paymentStatus, remainingBalance, totalAmount } = getPaymentInfo(booking);
        const isCancelled = (booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled';
        const isCompleted = (booking?.booking_status || booking?.status || '').toLowerCase() === 'completed';
        const paymentRequired = booking?.payment_required !== false;

        if (isCancelled || isCompleted) return false;
        if (!paymentRequired) return false;
        if (paymentStatus === 'paid') return false;

        return remainingBalance > 0;
    };

    // Calculate payment statistics
    const paymentStats = useMemo(() => {
        let totalOutstanding = 0;
        let totalPaidAmount = 0;
        let unpaidCount = 0;
        let partialCount = 0;

        bookings.forEach(booking => {
            const { totalPaid, totalAmount, remainingBalance, paymentStatus } = getPaymentInfo(booking);
            totalPaidAmount += totalPaid;
            totalOutstanding += remainingBalance;
            if (paymentStatus === 'unpaid') unpaidCount++;
            if (paymentStatus === 'partial') partialCount++;
        });

        return { totalOutstanding, totalPaid: totalPaidAmount, unpaidCount, partialCount };
    }, [bookings, bookingPayments]);

    // Get bookings that need payment
    const outstandingBookings = bookings.filter(booking => {
        const { paymentStatus, remainingBalance } = getPaymentInfo(booking);
        const isCancelled = (booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled';
        return !isCancelled && remainingBalance > 0 && (paymentStatus === 'unpaid' || paymentStatus === 'partial');
    });

    // Get all payments (flattened)
    const allPayments = useMemo(() => {
        const payments = [];
        bookings.forEach(booking => {
            const bookingPaymentsList = bookingPayments[booking.booking_id || booking.id] || [];
            bookingPaymentsList.forEach(payment => {
                payments.push({
                    ...payment,
                    booking: booking,
                    packageName: getPackageName(booking),
                });
            });
        });
        return payments.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [bookings, bookingPayments]);

    if (loading) {
        return (
            <div className="px-4 py-8 lg:px-6">
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-4" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="px-4 py-8 lg:px-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                        <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Payments
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage your payments and view payment history
                        </p>
                    </div>
                </div>

                <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Track all your payments, view payment history, and make payments for your bookings.</span>
                    </div>
                </Card>
            </div>

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Outstanding</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₱{paymentStats.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-400 shadow-sm">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Paid</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₱{paymentStats.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 text-green-600 dark:from-green-900/40 dark:to-green-900/20 dark:text-green-400 shadow-sm">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pending Payments</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {outstandingBookings.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {paymentStats.unpaidCount} unpaid, {paymentStats.partialCount} partial
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 dark:from-yellow-900/40 dark:to-yellow-900/20 dark:text-yellow-400 shadow-sm">
                            <Clock className="w-8 h-8" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Outstanding Payments */}
            {outstandingBookings.length > 0 && (
                <Card className="mb-8 p-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Outstanding Payments</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Bookings that require payment</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {outstandingBookings.map((booking) => {
                            const { totalPaid, totalAmount, remainingBalance, paymentStatus } = getPaymentInfo(booking);
                            return (
                                <div
                                    key={booking.booking_id || booking.id}
                                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-white dark:hover:bg-gray-800/50 transition-all duration-200 bg-white dark:bg-gray-800/30 shadow-sm hover:shadow-md"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                        {getPackageName(booking)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-wrap mb-3">
                                                        {getPaymentStatusBadge(paymentStatus)}
                                                        <Badge variant="outline" className="text-xs">
                                                            Booking #{booking.booking_id || booking.id}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Amount</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                                        ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Paid</span>
                                                    <span className="text-base font-semibold text-green-600 dark:text-green-400">
                                                        ₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Remaining</span>
                                                    <span className="text-base font-bold text-red-600 dark:text-red-400">
                                                        ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Event Date</span>
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">
                                                        {booking.event_date
                                                            ? new Date(booking.event_date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })
                                                            : 'TBD'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {canShowPayButton(booking) && (
                                                <Button
                                                    variant="default"
                                                    size="default"
                                                    onClick={() => handlePayNow(booking)}
                                                    className="bg-gradient-to-r from-[#a413ec] to-[#8a0fd4] hover:from-[#8a0fd4] hover:to-[#7a0fc4] text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 font-semibold"
                                                >
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Pay Now
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="default"
                                                onClick={() => navigate(`/dashboard?view=bookings`)}
                                                className="px-4 py-2.5"
                                            >
                                                View Details
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Payment History */}
            <Card className="p-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-md">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Payment History</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">All your payment transactions</p>
                </div>

                {allPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No payment history
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your payment transactions will appear here once you make a payment.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {allPayments.map((payment) => {
                            const getPaymentStatusIcon = () => {
                                switch (payment.status) {
                                    case 'paid':
                                        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
                                    case 'pending':
                                        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
                                    case 'failed':
                                    case 'cancelled':
                                        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
                                    default:
                                        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
                                }
                            };

                            return (
                                <div
                                    key={payment.payment_id || payment.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-white dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-800/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                                {getPaymentStatusIcon()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {payment.packageName || 'Event Package'}
                                                    </h4>
                                                    {getPaymentStatusBadge(payment.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {payment.created_at
                                                            ? new Date(payment.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })
                                                            : 'N/A'}
                                                    </span>
                                                    {payment.transaction_id && (
                                                        <span className="text-xs font-mono">
                                                            TXN: {payment.transaction_id.slice(-8)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                ₱{parseFloat(payment.amount || 0).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                            {payment.method && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {payment.method}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Make Payment</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {selectedBookingForPayment && (() => {
                            const { remainingBalance, totalAmount } = getPaymentInfo(selectedBookingForPayment);
                            const bookingId = selectedBookingForPayment.booking_id || selectedBookingForPayment.id;
                            return (
                                <PaymentForm
                                    bookingId={bookingId}
                                    amount={remainingBalance || totalAmount}
                                    booking={selectedBookingForPayment}
                                    onSuccess={handlePaymentSuccess}
                                    onCancel={handlePaymentCancel}
                                />
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientPayments;
