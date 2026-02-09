import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import {
    Card,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    DataTable,
    Timeline,
    Badge
} from '../../../components/ui';
import BookingCancellationModal from '../../../components/modals/BookingCancellationModal';
import { AnalyticsCharts, AnimatedBackground, PullToRefresh } from '../../../components/features';
import PaymentForm from '../../../components/features/PaymentForm';
import { getBookingPayments } from '../../../api/services/paymentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui';
import { useToast } from '../../../hooks/use-toast';
import { Calendar, Clock, Package, Search, BarChart3, CreditCard, DollarSign, BookOpen, FileText } from 'lucide-react';
import BookingFilters from '../../../components/features/BookingFilters';
import BookingActionsDropdown from '../../../components/features/BookingActionsDropdown';
import InvoiceList from '../../../components/features/invoice/InvoiceList';

const ClientBookings = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
    const [bookingPayments, setBookingPayments] = useState({});
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [meta, setMeta] = useState({ total: 0, last_page: 1, status_counts: {} });

    // Determine initial tab from URL params
    const getInitialTab = () => {
        const tab = searchParams.get('tab');
        return tab || 'list';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState(() => {
        const tab = searchParams.get('tab');
        return tab === 'payments' ? 'unpaid' : 'all';
    });

    // Handle tab change - update both state and URL
    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        const newParams = { tab: newTab };
        setSearchParams(newParams, { replace: true });
    };

    // Sync activeTab with URL parameter
    useEffect(() => {
        const tabFromUrl = getInitialTab();
        if (tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }

        const tab = searchParams.get('tab');
        if (tab === 'payments' && paymentFilter === 'all') {
            setPaymentFilter('unpaid');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        fetchBookings(page);
    }, [page]);

    const fetchBookings = async (pageToLoad = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/bookings', {
                params: {
                    page: pageToLoad,
                    per_page: perPage,
                },
            });
            const bookingsData = response.data.data || response.data || [];
            setBookings(bookingsData);
            setMeta(response.data.meta || { total: 0, last_page: 1, status_counts: {} });
            setPage(response.data.meta?.current_page || pageToLoad);
        } catch (error) {
            if (error.response?.status === 401) {
                setBookings([]);
                setMeta({ total: 0, last_page: 1, status_counts: {} });
            } else {
                console.error('Error fetching bookings:', error);
                setBookings([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const handleCancelSuccess = () => {
        fetchBookings(page);
    };

    const handleRefresh = async () => {
        await fetchBookings(page);
    };

    // Payment functions
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
        const payments = bookingPayments[booking.booking_id || booking.id];

        let totalPaid = 0;
        if (payments) {
            totalPaid = payments
                .filter((p) => p.status === 'paid')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        } else {
            // Use pre-calculated value from API
            totalPaid = parseFloat(booking?.total_paid || 0);
        }

        // Try multiple possible paths for package price
        const packagePrice = getPackagePrice(booking);

        const totalAmount = parseFloat(booking?.total_amount || packagePrice || 0);

        // Use remaining_balance from API or calculate it
        const remainingBalance = payments
            ? Math.max(0, totalAmount - totalPaid)
            : parseFloat(booking?.remaining_balance ?? Math.max(0, totalAmount - totalPaid));

        const paymentStatus = booking?.payment_status || 'unpaid';

        return { totalPaid, totalAmount, remainingBalance, paymentStatus };
    };

    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
            partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
            paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
            refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
        };
        const config = statusConfig[status] || statusConfig.unpaid;
        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        );
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
        await fetchBookings(page);
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
    };

    const canShowPayButton = (booking) => {
        const { paymentStatus, remainingBalance, totalAmount } = getPaymentInfo(booking);
        const isCancelled = (booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled';
        const isCompleted = (booking?.booking_status || booking?.status || '').toLowerCase() === 'completed';
        const bookingStatus = (booking?.booking_status || booking?.status || '').toLowerCase();
        const paymentRequired = booking?.payment_required !== false;

        if (isCancelled || isCompleted) return false;
        if (!paymentRequired) return false;
        if (paymentStatus === 'paid') return false;

        if (bookingStatus === 'pending') {
            return totalAmount > 0;
        } else {
            return remainingBalance > 0;
        }
    };

    const canCancelBooking = (booking) => {
        const status = (booking.booking_status || booking.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'completed') {
            return false;
        }

        if (booking.event_date) {
            const eventDate = new Date(booking.event_date);
            const today = new Date();
            const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilEvent >= 0 && daysUntilEvent < 7) {
                return false;
            }
        }

        return true;
    };

    const getStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        const statusStyles = {
            confirmed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
            approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
            cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
            completed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        };

        const displayStatus = status || 'Unknown';
        const statusKey = normalizedStatus in statusStyles ? normalizedStatus : 'default';

        return (
            <Badge
                className={`${statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}
            >
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </Badge>
        );
    };

    const getPackagePrice = (booking) => {
        if (!booking) return null;

        const price = booking?.eventPackage?.package_price ||
            booking?.event_package?.package_price ||
            booking?.eventPackage?.price ||
            booking?.event_package?.price ||
            booking?.package?.package_price ||
            booking?.package?.price ||
            booking?.package_price ||
            booking?.price ||
            null;

        if (price === null || price === undefined || price === '' || price === 0 || isNaN(parseFloat(price))) {
            return null;
        }

        const numericPrice = parseFloat(price);
        return isNaN(numericPrice) ? null : numericPrice;
    };

    const getPackageName = (booking) => {
        return booking?.eventPackage?.package_name ||
            booking?.event_package?.package_name ||
            booking?.package?.name ||
            booking?.package?.package_name ||
            'N/A';
    };

    // Filter bookings based on filters
    const filteredBookings = useMemo(() => {
        return bookings.filter((booking) => {
            const bookingStatus = (booking.booking_status || booking.status || '').toLowerCase();
            const { paymentStatus } = getPaymentInfo(booking);

            if (statusFilter !== 'all') {
                if (statusFilter === 'approved' && bookingStatus !== 'approved' && bookingStatus !== 'confirmed') {
                    return false;
                }
                if (statusFilter !== 'approved' && bookingStatus !== statusFilter) {
                    return false;
                }
            }

            if (paymentFilter !== 'all' && paymentStatus !== paymentFilter) {
                return false;
            }

            return true;
        });
    }, [bookings, statusFilter, paymentFilter, bookingPayments]);

    const handleClearFilters = () => {
        setStatusFilter('all');
        setPaymentFilter('all');
    };

    if (loading) {
        return (
            <div className="px-4 py-8 lg:px-8">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
            <div className="relative min-h-screen">
                <AnimatedBackground
                    type="dots"
                    colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
                    speed={0.2}
                    className="opacity-5 dark:opacity-10"
                />
                <div className="px-4 py-6 lg:px-8 lg:py-8 relative z-10 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage all your event bookings</p>
                            </div>
                        </div>
                    </div>

                    {/* All Bookings with Tabs */}
                    <Card className="p-8 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors duration-300 shadow-md">
                        {bookings.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                                    <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No bookings yet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    Start by exploring our event packages and make your first booking!
                                </p>
                                <Link to="/dashboard/packages">
                                    <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                        <Package className="w-4 h-4 mr-2" />
                                        Browse Packages
                                    </Button>
                                </Link>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No bookings match your filters
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Try adjusting your filters to see more results.
                                </p>
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-5 mb-8 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg">
                                    <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                        <Package className="w-4 h-4" />
                                        <span className="font-medium">List View</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">Calendar</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">Timeline</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                        <BarChart3 className="w-4 h-4" />
                                        <span className="font-medium">Analytics</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="invoices" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">Invoices</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* Show message if on payments view */}
                                {searchParams.get('tab') === 'payments' && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                            <CreditCard className="w-5 h-5" />
                                            Showing bookings with payment information. Use filters to refine your search.
                                        </p>
                                    </div>
                                )}

                                {/* List View Tab */}
                                <TabsContent value="list" className="mt-0">
                                    <BookingFilters
                                        statusFilter={statusFilter}
                                        paymentFilter={paymentFilter}
                                        onStatusChange={setStatusFilter}
                                        onPaymentChange={setPaymentFilter}
                                        onClearFilters={handleClearFilters}
                                    />
                                    <DataTable
                                        data={filteredBookings.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))}
                                        columns={[
                                            {
                                                accessor: 'booking_id',
                                                header: 'ID',
                                                sortable: true,
                                                render: (row) => (
                                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                        #{row.booking_id || row.id}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'package_name',
                                                header: 'Package',
                                                sortable: true,
                                                render: (row) => (
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {getPackageName(row)}
                                                        </div>
                                                        {(row.event_type || row.theme) && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {row.event_type && <span>{row.event_type}</span>}
                                                                {row.event_type && row.theme && <span> • </span>}
                                                                {row.theme && <span>{row.theme}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'event_date',
                                                header: 'Event Date & Time',
                                                sortable: true,
                                                render: (row) => (
                                                    <div className="text-sm">
                                                        <div className="text-gray-900 dark:text-gray-200">
                                                            {row.event_date
                                                                ? new Date(row.event_date).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })
                                                                : 'N/A'}
                                                        </div>
                                                        {row.event_time && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {row.event_time}
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'event_venue',
                                                header: 'Venue',
                                                sortable: true,
                                                render: (row) => (
                                                    <div className="text-sm text-gray-900 dark:text-gray-200">
                                                        {row.event_venue || 'TBD'}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'guest_count',
                                                header: 'Guests',
                                                sortable: true,
                                                render: (row) => (
                                                    <div className="text-sm text-gray-900 dark:text-gray-200">
                                                        {row.guest_count || row.number_of_guests || 'N/A'}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'status',
                                                header: 'Status',
                                                sortable: true,
                                                render: (row) => getStatusBadge(row.booking_status || row.status),
                                            },
                                            {
                                                accessor: 'payment_status',
                                                header: 'Payment',
                                                sortable: true,
                                                render: (row) => {
                                                    const { paymentStatus, totalPaid, totalAmount, remainingBalance } = getPaymentInfo(row);
                                                    return (
                                                        <div className="space-y-1">
                                                            {getPaymentStatusBadge(paymentStatus)}
                                                            {totalAmount > 0 && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {totalPaid > 0 && (
                                                                        <div>Paid: ₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                                    )}
                                                                    {remainingBalance > 0 && (
                                                                        <div className="text-orange-600 dark:text-orange-400">
                                                                            Due: ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                },
                                            },
                                            {
                                                accessor: 'price',
                                                header: 'Total Price',
                                                sortable: true,
                                                render: (row) => (
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {getPackagePrice(row)
                                                                ? `₱${parseFloat(getPackagePrice(row)).toLocaleString('en-US', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : 'N/A'}
                                                        </div>
                                                        {row.deposit_amount && parseFloat(row.deposit_amount) > 0 && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                Deposit: ₱{parseFloat(row.deposit_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'actions',
                                                header: 'Actions',
                                                sortable: false,
                                                render: (row) => {
                                                    const bookingId = row.booking_id || row.id;
                                                    if (bookingId && !bookingPayments[bookingId]) {
                                                        fetchBookingPayments(bookingId);
                                                    }
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            {canShowPayButton(row) && (
                                                                <Button
                                                                    variant="default"
                                                                    size="default"
                                                                    onClick={() => handlePayNow(row)}
                                                                    className="bg-gradient-to-r from-[#a413ec] to-[#8a0fd4] hover:from-[#8a0fd4] hover:to-[#7a0fc4] text-white shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 font-semibold"
                                                                >
                                                                    <CreditCard className="w-4 h-4 mr-1.5" />
                                                                    Pay Now
                                                                </Button>
                                                            )}
                                                            <BookingActionsDropdown
                                                                booking={row}
                                                                onViewDetails={(b) => navigate(`/dashboard/bookings/${b.booking_id || b.id}`)}
                                                                onPayNow={handlePayNow}
                                                                onCancel={handleCancelClick}
                                                                canShowPayButton={canShowPayButton}
                                                                canCancelBooking={canCancelBooking}
                                                            />
                                                        </div>
                                                    );
                                                },
                                            },
                                        ]}
                                        searchable
                                        searchPlaceholder="Search bookings..."
                                        pagination
                                        pageSize={perPage}
                                    />
                                </TabsContent>

                                {/* Calendar View Tab */}
                                <TabsContent value="calendar" className="mt-0">
                                    <BookingCalendarView
                                        bookings={bookings}
                                        month={calendarMonth}
                                        onMonthChange={setCalendarMonth}
                                    />
                                </TabsContent>

                                {/* Timeline View Tab */}
                                <TabsContent value="timeline" className="mt-0">
                                    <BookingTimelineView bookings={bookings} />
                                </TabsContent>

                                {/* Analytics Tab */}
                                <TabsContent value="analytics" className="mt-0">
                                    <AnalyticsCharts bookings={bookings} />
                                </TabsContent>

                                {/* Invoices Tab */}
                                <TabsContent value="invoices" className="mt-0">
                                    <InvoiceList />
                                </TabsContent>
                            </Tabs>
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

                    <BookingCancellationModal
                        isOpen={showCancelModal}
                        onClose={() => {
                            setShowCancelModal(false);
                            setSelectedBooking(null);
                        }}
                        booking={selectedBooking}
                        onSuccess={handleCancelSuccess}
                    />
                </div>
            </div>
        </PullToRefresh>
    );
};

// Calendar View Component
const BookingCalendarView = ({ bookings, month, onMonthChange }) => {
    const eventsByDate = useMemo(() => {
        return bookings.reduce((acc, booking) => {
            if (!booking.event_date) return acc;
            const dateStr = new Date(booking.event_date).toISOString().split('T')[0];
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(booking);
            return acc;
        }, {});
    }, [bookings]);

    const sortedDates = useMemo(() => Object.keys(eventsByDate).sort(), [eventsByDate]);

    const formatDisplayDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        const statusStyles = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        const statusKey = normalizedStatus in statusStyles ? normalizedStatus : 'default';
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {(status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1)}
            </span>
        );
    };

    const getPackageName = (booking) => {
        return booking?.eventPackage?.package_name ||
            booking?.event_package?.package_name ||
            booking?.package?.name ||
            booking?.package?.package_name ||
            'N/A';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <input
                    type="month"
                    value={month}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors duration-300"
                />
            </div>

            {sortedDates.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="transition-colors duration-300">No bookings in this month.</p>
                </div>
            ) : (
                sortedDates.map((date) => (
                    <Card key={date} className="p-4 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">{formatDisplayDate(date)}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{eventsByDate[date].length} booking(s)</span>
                        </div>
                        <div className="space-y-3">
                            {eventsByDate[date].map((booking) => (
                                <div
                                    key={booking.booking_id || booking.id}
                                    className="p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-colors duration-300"
                                >
                                    <div className="flex-1">
                                        <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                                            {getPackageName(booking)}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                                            {booking.event_venue || 'Venue TBD'} • {booking.guest_count || booking.number_of_guests || 'N/A'} guests
                                        </p>
                                        {booking.event_time && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {booking.event_time}
                                            </p>
                                        )}
                                    </div>
                                    {getStatusBadge(booking.booking_status || booking.status)}
                                </div>
                            ))}
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
};

// Timeline View Component
const BookingTimelineView = ({ bookings }) => {
    const timelineItems = useMemo(() => {
        return bookings
            .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
            .map((booking) => {
                const getPackageName = (b) => {
                    return b?.eventPackage?.package_name ||
                        b?.event_package?.package_name ||
                        b?.package?.name ||
                        b?.package?.package_name ||
                        'N/A';
                };

                return {
                    id: booking.booking_id || booking.id,
                    title: getPackageName(booking),
                    subtitle: `Booking #${booking.booking_id || booking.id}`,
                    description: booking.special_requests || `Event scheduled for ${booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'TBD'}`,
                    date: booking.created_at || booking.updated_at,
                    status: booking.booking_status || booking.status,
                    venue: booking.event_venue,
                    guests: booking.guest_count || booking.number_of_guests,
                };
            });
    }, [bookings]);

    if (timelineItems.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="transition-colors duration-300">No booking history available.</p>
            </div>
        );
    }

    return <Timeline items={timelineItems} orientation="vertical" />;
};

export default ClientBookings;
