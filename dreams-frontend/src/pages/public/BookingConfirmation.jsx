import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, Calendar, Users, Package, MapPin, Clock, FileText, ArrowLeft, Download, Share2, CreditCard, DollarSign, History, Image as ImageIcon, X, Upload } from 'lucide-react';
import api from '../../api/axios';
import { Button, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '../../components/ui';
import { BookingStatusTracker, AnimatedBackground, ParticlesBackground } from '../../components/features';
import PaymentForm from '../../components/features/PaymentForm';
import { getBookingPayments } from '../../api/services/paymentService';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

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
  const [justPaid, setJustPaid] = useState(false);
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

  // Auto-open payment modal or show success message if requested via navigation state
  useEffect(() => {
    if (location.state?.showSuccessBanner) {
      setJustPaid(true);
      // Clean up the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);

      // Auto-hide after 10 seconds
      setTimeout(() => setJustPaid(false), 10000);
    }

    if (booking && location.state?.showPayment && !showPaymentModal && !justPaid) {
      const totalAmount = parseFloat(booking.total_amount || booking.package?.package_price || 0);
      if (totalAmount > 0) {
        setShowPaymentModal(true);
      }
    }
  }, [booking, location.state, justPaid]);

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
      fetchMoodBoard();
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
      fetchMoodBoard();
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
        description: 'Booking link copied to clipboard.',
      });
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalAmount = parseFloat(booking?.total_amount || booking?.package?.package_price || 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);
  const paymentStatus = booking?.payment_status || 'unpaid';

  const showPaymentButton =
    booking?.payment_required !== false &&
    paymentStatus !== 'paid' &&
    remainingBalance > 0 &&
    (booking?.booking_status || booking?.status || '').toLowerCase() !== 'cancelled';

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setJustPaid(true);
    toast({
      title: 'Payment Successful!',
      description: 'Your payment has been processed successfully.',
    });
    await fetchBookingDetails();
    await fetchPayments();

    // Smooth reset of the success banner after 10 seconds
    setTimeout(() => setJustPaid(false), 10000);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      unpaid: { label: 'Unpaid', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
      partial: { label: 'Partial', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      paid: { label: 'Paid', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
      refunded: { label: 'Refunded', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <Badge variant="outline" className={cn("px-3 py-1 font-bold rounded-full", config.className)}>
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
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 text-center rounded-[2rem] border-red-500/20 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The requested booking detail doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/dashboard/bookings')} className="w-full h-12 rounded-xl font-bold bg-primary hover:scale-[1.02] transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative min-h-screen transition-colors duration-500",
      isDashboard ? "py-8 px-4 lg:px-8" : "bg-[#050811] py-16 px-4"
    )}>
      {!isDashboard && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <AnimatedBackground type="mesh" colors={['#3B82F6', '#8B5CF6', '#D946EF']} speed={0.1} blur={true} />
          </div>
          <ParticlesBackground particleCount={30} particleColor="rgba(147, 197, 253, 0.2)" speed={0.02} />
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Top Navbar Simulation for Detail View */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard/bookings')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-sm font-bold shadow-sm hover:translate-x-[-4px] transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>

          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="ghost" className="rounded-xl h-10 px-4 bg-white/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-all border border-white/20 dark:border-white/10">
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button onClick={handleShare} variant="ghost" className="rounded-xl h-10 px-4 bg-white/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-all border border-white/20 dark:border-white/10">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Status / Success Banner */}
        {(justPaid || booking.status === 'confirmed') && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700 bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl border border-green-500/20 p-6 rounded-[2rem] flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-green-600 dark:text-green-400">Payment Successful!</h3>
              <p className="text-sm dark:text-green-300/70">Your payment has been confirmed. Your booking is now secured.</p>
            </div>
          </div>
        )}

        {/* Hero Section Card */}
        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-none font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
                    #{booking.id || booking.booking_id}
                  </Badge>
                  <Badge className={cn("capitalize px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                    booking.status === 'pending' ? "bg-amber-500/20 text-amber-500" :
                      booking.status === 'confirmed' ? "bg-green-500/20 text-green-500" :
                        "bg-blue-500/20 text-blue-500"
                  )}>
                    {booking.status || 'Pending'}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight">
                  {booking.package?.package_name || booking.package_name || 'Event Package'}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>{formatDate(booking.event_date)}</span>
                  </div>
                  {booking.event_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span>{booking.event_time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span>{booking.number_of_guests || 0} Guests</span>
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right space-y-1">
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Investment</p>
                <p className="text-4xl font-black text-primary">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Tracker Section */}
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black dark:text-white">Planning Progress</h2>
          </div>
          <BookingStatusTracker status={booking.status || 'pending'} />
        </div>

        {/* Split Grid for Info and Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Details Section */}
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-black dark:text-white">Venue & Extras</h2>
            </div>

            <div className="space-y-6 flex-1">
              <div className="p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-white/5 group hover:border-primary/20 transition-all duration-300">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Event Location</p>
                <p className="text-lg font-bold dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {booking.event_venue || 'TBA - Coordinate with us'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-white/5 group hover:border-primary/20 transition-all duration-300">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Special Notes</p>
                <p className="text-sm font-medium dark:text-gray-300 leading-relaxed italic">
                  {booking.special_requests ? `"${booking.special_requests}"` : "None specified. Feel free to message us any time!"}
                </p>
              </div>

              {/* Mood Board Mini Preview / Upload */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider dark:text-white">Vision Board</h3>
                    <p className="text-xs text-gray-500">{moodBoard.length} images shared</p>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                  </label>
                </div>

                <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
                  {moodBoard.map((img, i) => (
                    <div key={i} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 relative group">
                      <img src={img.url || img.path} className="w-full h-full object-cover" />
                      <button onClick={() => handleDeleteFile(i)} className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {moodBoard.length === 0 && (
                    <p className="text-xs text-slate-400 py-4">Upload some inspiration photos to help us plan!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] flex flex-col relative overflow-hidden">
            {/* Gradient Accent */}
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black dark:text-white">Billing</h2>
              </div>
              {getPaymentStatusBadge(paymentStatus)}
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-white/5">
                <span className="font-bold text-gray-500 uppercase text-xs tracking-widest">Amount Paid</span>
                <span className="text-2xl font-black text-green-500 uppercase">{formatPrice(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between p-6 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                <span className="font-bold text-primary uppercase text-xs tracking-widest">Balance Due</span>
                <span className="text-2xl font-black text-primary uppercase">{formatPrice(remainingBalance)}</span>
              </div>

              {showPaymentButton && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-xl font-black dark:text-white shadow-xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  Make a Secure Payment
                </Button>
              )}

              {/* Payment History List */}
              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Recent Transactions</h3>
                {payments.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl dark:bg-gray-900/40 border border-white/5 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <CheckCircle2 className={cn("w-4 h-4", p.status === 'paid' ? "text-green-500" : "text-gray-500")} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{getPaymentMethodDisplay(p.payment_method)}</p>
                        <p className="text-[10px] text-gray-500">{p.paid_at ? format(new Date(p.paid_at), 'MMM dd') : 'Pending'}</p>
                      </div>
                    </div>
                    <span className="font-black dark:text-white">{formatPrice(p.amount)}</span>
                  </div>
                ))}
                {payments.length > 3 && (
                  <button className="w-full text-center text-xs font-bold text-primary py-2 hover:underline">View All {payments.length} Payments</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="glass-card p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-indigo-500 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-indigo-500/20">
              <ArrowLeft className="w-10 h-10 text-white rotate-180" />
            </div>
            <div>
              <h3 className="text-3xl font-black dark:text-white mb-4">What's the next step?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  "Our design team will review your shared mood board and special requests.",
                  "A dedicated coordinator will reach out to you within 48 hours for a quick call.",
                  "Stay tuned for a more detailed itinerary and vendor updates on this dashboard.",
                  "Any balance payments are due at least 14 days before the event date."
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm font-medium dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-black">{i + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Dialog Wrapper with Custom Styles */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0d1529] border-none shadow-3xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-3xl font-black">Make Payment</DialogTitle>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </DialogHeader>
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
    </div>
  );
};

export default BookingConfirmation;

