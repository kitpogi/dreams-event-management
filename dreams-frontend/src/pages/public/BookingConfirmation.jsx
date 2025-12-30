import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, Calendar, Users, Package, MapPin, Clock, FileText, ArrowLeft, Download, Share2 } from 'lucide-react';
import api from '../../api/axios';
import { Button, Skeleton } from '../../components/ui';
import { BookingStatusTracker } from '../../components/features';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 space-y-6">
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
      <div className="min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Booking Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The booking you're looking for doesn't exist or has been removed.</p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your booking has been successfully created. We'll contact you soon to finalize the details.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                View All Bookings
              </Button>
            </Link>
          </div>
        </div>

        {/* Booking Status Tracker */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Booking Status</h2>
          <BookingStatusTracker status={booking.status || 'pending'} />
        </div>

        {/* Booking Details */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Booking Details</h2>
          
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

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-6">
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

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Link to="/packages">
            <Button variant="outline" className="mr-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse More Packages
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

