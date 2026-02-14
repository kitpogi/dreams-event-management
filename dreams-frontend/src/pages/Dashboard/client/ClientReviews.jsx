import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Star, Sparkles, CheckCircle2, Calendar, FileText, ChevronRight, PenTool } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import Reviews from '../../public/Reviews';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { TestimonialFormModal } from '../../../components/modals';
import { useToast } from '../../../hooks/use-toast';

const ClientReviews = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bookingsRes, testimonialsRes] = await Promise.all([
                api.get('/bookings'),
                api.get('/testimonials')
            ]);

            const bookingsData = bookingsRes.data.data || bookingsRes.data || [];
            const testimonialsData = testimonialsRes.data.data || testimonialsRes.data || [];

            setBookings(bookingsData);

            // Filter reviews that belong to the current user
            // We'll match by name as a fallback, but ideally the backend should provide a user_id
            const userReviews = testimonialsData.filter(rev =>
                rev.client_name === user?.name || rev.user_id === user?.id
            );
            setMyReviews(userReviews);
        } catch (error) {
            console.error('Error fetching reviews data:', error);
            toast({
                title: "Error",
                description: "Failed to load reviews data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate which bookings are ready for review (Completed and not reviewed yet)
    const pendingReviews = useMemo(() => {
        return bookings.filter(booking => {
            const isCompleted = (booking.booking_status || booking.status || '').toLowerCase() === 'completed';
            if (!isCompleted) return false;

            // Check if a review already exists for this booking date/type
            // Note: Ideally the testimonial should have a booking_id
            const hasReview = myReviews.some(rev =>
                rev.booking_id === (booking.booking_id || booking.id) ||
                (rev.event_date === booking.event_date && rev.event_type === (booking.package?.package_category || ''))
            );

            return !hasReview;
        });
    }, [bookings, myReviews]);

    const handleWriteReview = (booking = null) => {
        setSelectedBooking(booking);
        setIsFormOpen(true);
    };

    if (loading) {
        return (
            <div className="px-4 py-8 lg:px-8 w-full">
                <div className="mb-10">
                    <Skeleton className="h-12 w-64 mb-4" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="px-4 py-8 lg:px-8 lg:py-8 relative z-10 w-full">
            {/* Dashboard Header */}
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-500/20 group relative overflow-hidden transition-transform duration-500 hover:scale-110">
                            <Star className="w-7 h-7 text-white relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                My Reviews
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                                Your Feedback & Community Experiences
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => handleWriteReview()}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-500/20 rounded-xl px-6 py-6 h-auto font-bold transition-all duration-300 hover:scale-[1.02]"
                    >
                        <PenTool className="w-5 h-5 mr-2" />
                        Share New Experience
                    </Button>
                </div>

                <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl p-4 border-none rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-amber-400" />
                        </div>
                        <span className="font-medium italic">Your words help us grow and help other couples dream big. Thank you for being part of our journey!</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Selection */}
            <Tabs defaultValue="my-feedback" className="w-full">
                <TabsList className="grid w-fit grid-cols-2 mb-10 bg-blue-500/5 dark:bg-white/5 p-1 rounded-2xl border border-blue-500/10 h-auto">
                    <TabsTrigger
                        value="my-feedback"
                        className="flex items-center gap-2 rounded-xl px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xl"
                    >
                        <Star className="w-4 h-4" />
                        <span className="font-bold">My Feedback</span>
                        {pendingReviews.length > 0 && (
                            <Badge className="ml-1 bg-amber-500 text-white border-none text-[10px] h-4 min-w-[16px] p-0 flex items-center justify-center">
                                {pendingReviews.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="community"
                        className="flex items-center gap-2 rounded-xl px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xl"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-bold">Community</span>
                    </TabsTrigger>
                </TabsList>

                {/* MY FEEDBACK CONTENT */}
                <TabsContent value="my-feedback" className="space-y-10 outline-none">
                    {/* Pending Reviews Section */}
                    {pendingReviews.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl p-6 md:p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl shadow-amber-500/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Pending Feedback</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">You have completed events waiting for your thoughts!</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingReviews.map(booking => (
                                    <div
                                        key={booking.booking_id || booking.id}
                                        className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-5 border border-white dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-gray-800">
                                                {booking.package?.package_category || 'Event'}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 font-mono">#{booking.booking_id || booking.id}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                            {booking.package?.package_name || 'Event Celebration'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(booking.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <Button
                                            onClick={() => handleWriteReview(booking)}
                                            size="sm"
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all group-hover:scale-[1.02]"
                                        >
                                            Write Review
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Review History */}
                    <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-none shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Review History</h2>
                            </div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{myReviews.length} Reviews</span>
                        </div>

                        {myReviews.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Share your first experience with us! Your feedback is highly appreciated.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {myReviews.map((review, idx) => (
                                    <div
                                        key={review.id || idx}
                                        className="bg-white/50 dark:bg-blue-900/10 border border-blue-500/10 rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400 shadow-amber-400/50' : 'text-gray-300 dark:text-gray-700'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                                            {review.event_type}
                                            <span className="text-gray-300 dark:text-gray-700">•</span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {new Date(review.event_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-4 line-clamp-4 leading-relaxed font-medium">
                                            "{review.message}"
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-blue-500/5">
                                            <Badge className={`text-[9px] font-bold ${review.is_featured
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {review.is_featured ? 'Published' : 'Under Review'}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                Submitted {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* COMMUNITY REVIEWS CONTENT */}
                <TabsContent value="community" className="outline-none">
                    <div className="bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl rounded-2xl p-2 md:p-4 border-none shadow-xl overflow-hidden">
                        <Reviews compact={true} />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Testimonial Form Modal */}
            <TestimonialFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => {
                    setIsFormOpen(false);
                    fetchData();
                    toast({
                        title: "Review Submitted!",
                        description: "Thank you for your feedback. It has been sent for moderation.",
                    });
                }}
            />
        </div>
    );
};

export default ClientReviews;
