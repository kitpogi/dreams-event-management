import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, Calendar, Users, Package, MapPin, Clock, FileText, ArrowLeft, Download, Share2, CreditCard, DollarSign, History, Image as ImageIcon, X, Upload } from 'lucide-react';
import api from '../../api/axios';
import { Button, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '../../components/ui';
import { BookingStatusTracker } from '../../components/features';
import PaymentForm from '../../components/features/PaymentForm';
import { getBookingPayments } from '../../api/services/paymentService';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [moodBoard, setMoodBoard] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
      fetchPayments();
      fetchMoodBoard();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking?.mood_board) {
      setMoodBoard(booking.mood_board);
    }
  }, [booking]);

  // Auto-open payment modal if requested via navigation state
  useEffect(() => {
    if (booking && location.state?.showPayment && !showPaymentModal) {
      // Only open if payment is actually needed
      const totalAmount = parseFloat(booking.total_amount || booking.package?.package_price || 0);
      // We assume initial fetch might not have payments yet, but usually for new booking it's 0 paid
      if (totalAmount > 0) {
        setShowPaymentModal(true);
        // Clear the state so it doesn't reopen on refresh if we could (React Router state persists on refresh usually, but good practice)
        // actually we can't easily clear location state without navigating again, which might be jarring.
        // We'll just rely on the dependency check.
      }
    }
  }, [booking, location.state]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!bookingId) return;
    try {
      setPaymentsLoading(true);
      const response = await getBookingPayments(bookingId);
      setPayments(response.data || response || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Don't show error toast for payments, just log it
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchMoodBoard = async () => {
    if (!bookingId) return;
    try {
      const response = await api.get(`/bookings/${bookingId}/attachments`);
      setMoodBoard(response.data.data || []);
    } catch (error) {
      console.error('Error fetching mood board:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!bookingId || !files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await api.post(`/bookings/${bookingId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success!',
        description: `${response.data.data.uploaded.length} file(s) uploaded successfully.`,
      });
      fetchMoodBoard(); // Refresh to get all files
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileIndex) => {
    if (!bookingId) return;

    try {
      await api.delete(`/bookings/${bookingId}/attachments/${fileIndex}`);
      toast({
        title: 'File Deleted',
        description: 'File removed successfully.',
      });
      fetchMoodBoard(); // Refresh
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast({
      title: 'Download',
      description: 'PDF download feature coming soon!',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Booking Confirmation',
        text: `I've booked ${booking?.package?.package_name || 'a package'} for ${formatDate(booking?.event_date)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Booking confirmation link has been copied to your clipboard.',
      });
    }
  };

  // Calculate payment totals
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalAmount = parseFloat(booking?.total_amount || booking?.package?.package_price || 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);
  const paymentStatus = booking?.payment_status || 'unpaid';

  // Check if payment button should be shown
  const showPaymentButton =
    booking?.payment_required !== false &&
    paymentStatus !== 'paid' &&
    remainingBalance > 0 &&
    (booking?.booking_status || booking?.status || '').toLowerCase() !== 'cancelled';

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    toast({
      title: 'Payment Successful!',
      description: 'Your payment has been processed successfully.',
    });
    // Refresh booking and payment data
    await fetchBookingDetails();
    await fetchPayments();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      unpaid: { label: 'Unpaid', variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      partial: { label: 'Partial', variant: 'warning', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      paid: { label: 'Paid', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      refunded: { label: 'Refunded', variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      card: 'Credit/Debit Card',
      gcash: 'GCash',
      maya: 'Maya',
      qr_ph: 'QR Ph',
      bank_transfer: 'Bank Transfer',
      otc: 'Over-the-Counter',
    };
    return methods[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A');
  };

  const getPaymentStatusDisplay = (status) => {
    const statuses = {
      pending: 'Pending',
      processing: 'Processing',
      paid: 'Paid',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return statuses[status] || status || 'Unknown';
  };

  if (loading) {
    return (
      <div className={`${isDashboard ? 'py-6 px-4 lg:px-6' : 'min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] py-12'}`}>
        <div className={`${isDashboard ? 'max-w-5xl' : 'container mx-auto px-4 max-w-4xl'}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={`${isDashboard ? 'py-6 px-4 lg:px-6' : 'min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] py-12'} flex items-center justify-center`}>
        <div className={`${isDashboard ? 'max-w-5xl w-full' : 'container mx-auto px-4 max-w-4xl'}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Booking Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The booking you're looking for doesn't exist or has been removed.</p>
            <Link to={isDashboard ? '/dashboard/bookings' : '/dashboard'}>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isDashboard ? 'Back to Bookings' : 'Go to Dashboard'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDashboard ? 'py-6 px-4 lg:px-6' : 'min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] py-12'}`}>
      <div className={`${isDashboard ? 'max-w-5xl' : 'container mx-auto px-4 max-w-4xl'}`}>

        {/* Dashboard Breadcrumb / Back Navigation */}
        {isDashboard && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard/bookings')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </button>
          </div>
        )}

        {/* Success Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Booking #{booking.id || booking.booking_id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your booking has been successfully created. We'll contact you soon to finalize the details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleDownload} variant="outline" size="sm" className="rounded-lg">
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm" className="rounded-lg">
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </Button>
            {!isDashboard && (
              <Link to="/dashboard" className="ml-auto">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  View All Bookings
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Booking Status Tracker */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Booking Status</h2>
          <BookingStatusTracker status={booking.status || 'pending'} />
        </div>

        {/* Booking Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Booking Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking ID */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="p-2 rounded-lg bg-[#a413ec]/10">
                <Package className="w-5 h-5 text-[#a413ec]" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Booking ID</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  #{booking.id || booking.booking_id}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {booking.status || 'Pending'}
                </p>
              </div>
            </div>

            {/* Package Name */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 md:col-span-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Package</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.package?.package_name || booking.package_name || 'Package'}
                </p>
                {booking.package?.package_price && (
                  <p className="text-sm text-[#a413ec] mt-1">
                    {formatPrice(booking.package.package_price)}
                  </p>
                )}
              </div>
            </div>

            {/* Event Date */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Event Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(booking.event_date)}
                </p>
              </div>
            </div>

            {/* Event Time */}
            {booking.event_time && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Event Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {booking.event_time}
                  </p>
                </div>
              </div>
            )}

            {/* Number of Guests */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Number of Guests</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.number_of_guests || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 md:col-span-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Special Requests</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-line">
                    {booking.special_requests}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mood Board / Inspiration Photos */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#a413ec]" />
            Mood Board & Inspiration Photos
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload photos, mood boards, or inspiration images to help us understand your vision for the event.
          </p>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block mb-2">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#a413ec] dark:hover:border-[#a413ec] transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                  className="hidden"
                  id="mood-board-upload"
                />
                <label htmlFor="mood-board-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB each (max 10 files)
                  </p>
                </label>
              </div>
            </label>
          </div>

          {/* Uploaded Images Grid */}
          {moodBoard.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {moodBoard.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={file.url || file.path}
                    alt={file.original_name || `Mood board ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => handleDeleteFile(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {file.original_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {moodBoard.length === 0 && !uploading && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images uploaded yet</p>
            </div>
          )}
        </div>

        {/* Payment Section */}
        {booking?.payment_required !== false && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-[#a413ec]" />
                Payment Information
              </h2>
              {getPaymentStatusBadge(paymentStatus)}
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(totalAmount)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatPrice(totalPaid)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining Balance</p>
                <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatPrice(remainingBalance)}
                </p>
              </div>
            </div>

            {/* Pay Now Button */}
            {showPaymentButton && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-6"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now — {formatPrice(remainingBalance)}
                </Button>
              </div>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Payment History
                </h3>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(payment.amount)}
                            </p>
                            <Badge
                              className={
                                payment.status === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : payment.status === 'failed'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : payment.status === 'pending' || payment.status === 'processing'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }
                            >
                              {getPaymentStatusDisplay(payment.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Method:</span>{' '}
                              {getPaymentMethodDisplay(payment.payment_method)}
                            </div>
                            {payment.paid_at && (
                              <div>
                                <span className="font-medium">Date:</span>{' '}
                                {format(new Date(payment.paid_at), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {payment.transaction_id && (
                              <div className="md:col-span-2">
                                <span className="font-medium">Transaction ID:</span>{' '}
                                <span className="font-mono text-xs">{payment.transaction_id}</span>
                              </div>
                            )}
                          </div>
                          {payment.failure_reason && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              {payment.failure_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payments.length === 0 && !paymentsLoading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No payment history available</p>
              </div>
            )}

            {paymentsLoading && (
              <div className="text-center py-8">
                <Skeleton className="h-20 w-full mb-3" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <PaymentForm
                bookingId={booking?.booking_id || booking?.id || bookingId}
                booking={booking}
                amount={totalAmount}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What's Next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Our team will review your booking and contact you within 24-48 hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>You'll receive a confirmation email with all the details.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>You can view and manage your booking from your dashboard.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>If you have any questions, feel free to contact us.</span>
            </li>
          </ul>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={isDashboard ? '/dashboard/packages' : '/packages'}>
            <Button variant="outline" className="rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse More Packages
            </Button>
          </Link>
          <Link to={isDashboard ? '/dashboard/bookings' : '/dashboard'}>
            <Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              {isDashboard ? 'All Bookings' : 'Go to Dashboard'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

