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
            <div className="px-4 py-8 lg:px-6 w-full">
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
        <div className="px-4 py-8 lg:px-6 w-full">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-500/20">
                        <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Payments
                        </h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                            Manage your transactions
                        </p>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl p-4 border-none rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium italic">Track your payment journey, view history, and secure your dream event with ease.</span>
                    </div>
                </div>
            </div>

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Outstanding</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                ₱{paymentStats.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-400 shadow-sm">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Paid</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                ₱{paymentStats.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 text-green-600 dark:from-green-900/40 dark:to-green-900/20 dark:text-green-400 shadow-sm">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pending Payments</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
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
                </div>
            </div>

            {/* Outstanding Payments */}
            {outstandingBookings.length > 0 && (
                <div className="mb-12 p-6 sm:p-8 bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl border-none shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Outstanding Payments</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Bookings that require attention</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {outstandingBookings.map((booking) => {
                            const { totalPaid, totalAmount, remainingBalance, paymentStatus } = getPaymentInfo(booking);
                            return (
                                <div
                                    key={booking.booking_id || booking.id}
                                    className="border-2 border-gray-100 dark:border-blue-900/10 rounded-xl p-6 hover:bg-white dark:hover:bg-blue-900/20 transition-all duration-300 bg-white/50 dark:bg-blue-900/10 shadow-sm hover:shadow-md"
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
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Amount</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                                        ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Paid</span>
                                                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                                        ₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Remaining</span>
                                                    <span className="text-base font-bold text-red-600 dark:text-red-400">
                                                        ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Event Date</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">
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
                                                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 px-6 py-2.5 font-bold"
                                                >
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Pay Now
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="default"
                                                onClick={() => navigate(`/dashboard/bookings/${booking.booking_id || booking.id}`)}
                                                className="px-4 py-2.5 font-bold rounded-xl border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                Details
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="p-6 sm:p-8 bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl border-none shadow-xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Payment History</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">History of your successful transactions</p>
                </div>

                {allPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 transition-colors">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            No payment history
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
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
                                    className="border border-gray-100 dark:border-blue-900/10 rounded-xl p-4 hover:bg-white dark:hover:bg-blue-900/20 transition-all duration-300 bg-white/50 dark:bg-blue-900/10"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-blue-900/30">
                                                {getPaymentStatusIcon()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                        {payment.packageName || 'Event Package'}
                                                    </h4>
                                                    {getPaymentStatusBadge(payment.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500 dark:text-gray-400">
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
                                                        <span className="font-mono text-blue-500/70">
                                                            TXN: {payment.transaction_id.slice(-8).toUpperCase()}
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
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
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
            </div>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none bg-white/90 dark:bg-[#0b1121]/90 backdrop-blur-2xl rounded-3xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Make Payment</DialogTitle>
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
