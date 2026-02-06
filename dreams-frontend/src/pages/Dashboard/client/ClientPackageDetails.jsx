import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { 
    LoadingSpinner, 
    OptimizedImage, 
    Skeleton, 
    Tabs, 
    TabsList, 
    TabsTrigger, 
    TabsContent, 
    ShareButton, 
    FavoriteButton, 
    FAQ, 
    Button,
    Card,
    Badge
} from '../../../components/ui';
import { BookingFormModal, AuthModal } from '../../../components/modals';
import ImageGallery from '../../../components/features/ImageGallery';
import PackageComparison from '../../../components/features/PackageComparison';
import PackageCard from '../../../components/features/PackageCard';
import { 
    Star, 
    User, 
    Scale, 
    ExternalLink, 
    Play, 
    ArrowLeft, 
    Package, 
    Users, 
    MapPin, 
    Calendar,
    CheckCircle2,
    Clock,
    Heart,
    Sparkles
} from 'lucide-react';

const ClientPackageDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [relatedPackages, setRelatedPackages] = useState([]);
    const [relatedPackagesLoading, setRelatedPackagesLoading] = useState(false);
    const [comparisonPackages, setComparisonPackages] = useState([]);
    const [showComparisonModal, setShowComparisonModal] = useState(false);

    useEffect(() => {
        fetchPackageDetails();
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (packageData && packageData.category) {
            fetchRelatedPackages();
        }
    }, [packageData]);

    const fetchReviews = async () => {
        if (!id) return;
        setReviewsLoading(true);
        try {
            const response = await api.get('/reviews', {
                params: { package_id: id }
            });
            const reviewsData = response.data.data || response.data || [];
            
            if (reviewsData.length === 0) {
                const testimonialResponse = await api.get('/testimonials', {
                    params: { limit: 6 }
                });
                setReviews(testimonialResponse.data.data || testimonialResponse.data || []);
            } else {
                setReviews(reviewsData);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            try {
                const testimonialResponse = await api.get('/testimonials', {
                    params: { limit: 6 }
                });
                setReviews(testimonialResponse.data.data || testimonialResponse.data || []);
            } catch (err) {
                console.error('Error fetching testimonials:', err);
            }
        } finally {
            setReviewsLoading(false);
        }
    };

    const fetchPackageDetails = async () => {
        try {
            const response = await api.get(`/packages/${id}`);
            const data = response.data.data || response.data;
            setPackageData({
                ...data,
                name: data.package_name || data.name,
                price: data.package_price || data.price,
                description: data.package_description || data.description,
                capacity: data.capacity,
                images: data.images || [],
                inclusions: data.package_inclusions || data.inclusions,
                category: data.package_category || data.category,
            });
        } catch (error) {
            console.error('Error fetching package details:', error);
            toast.error('Failed to load package details');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedPackages = async () => {
        if (!packageData || !packageData.category) return;
        setRelatedPackagesLoading(true);
        try {
            const response = await api.get('/packages', {
                params: {
                    category: packageData.category,
                    per_page: 6
                }
            });
            const packages = response.data.data || response.data || [];
            const filtered = packages
                .filter(pkg => (pkg.package_id || pkg.id) !== id)
                .slice(0, 3);
            setRelatedPackages(filtered);
        } catch (error) {
            console.error('Error fetching related packages:', error);
        } finally {
            setRelatedPackagesLoading(false);
        }
    };

    const handleBookNow = () => {
        setShowBookingModal(true);
    };

    const handleBookingSuccess = () => {
        navigate('/dashboard/bookings');
    };

    const handleAddToComparison = (pkg) => {
        const packageId = pkg.package_id || pkg.id;
        const currentPackageInComparison = comparisonPackages.find(
            p => (p.package_id || p.id) === id
        );
        
        let updatedPackages = [...comparisonPackages];
        if (!currentPackageInComparison) {
            updatedPackages.push(packageData);
        }
        
        if (!updatedPackages.find(p => (p.package_id || p.id) === packageId)) {
            if (updatedPackages.length < 3) {
                updatedPackages.push(pkg);
                setComparisonPackages(updatedPackages);
                toast.success('Package added to comparison');
            } else {
                toast.error('You can compare up to 3 packages. Remove one to add another.');
            }
        } else {
            toast.info('Package is already in comparison');
        }
    };

    const handleRemoveFromComparison = (packageId) => {
        setComparisonPackages(comparisonPackages.filter(p => (p.package_id || p.id) !== packageId));
    };

    const handleOpenComparison = () => {
        let packagesToCompare = [...comparisonPackages];
        const currentPackageInComparison = packagesToCompare.find(
            p => (p.package_id || p.id) === id
        );
        if (!currentPackageInComparison && packageData) {
            packagesToCompare = [packageData, ...packagesToCompare];
            setComparisonPackages(packagesToCompare);
        }
        if (packagesToCompare.length > 0) {
            setShowComparisonModal(true);
        } else {
            toast.error('No packages to compare.');
        }
    };

    const formatPrice = (price) => {
        const numPrice = parseFloat(price || 0);
        return `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const parseInclusions = (inclusions) => {
        if (!inclusions) return [];
        if (typeof inclusions === 'string') {
            const items = inclusions.split(/\n|,/).filter(item => item.trim()).map(item => item.trim());
            return items;
        }
        return Array.isArray(inclusions) ? inclusions : [];
    };

    const getPackageImages = () => {
        if (packageData?.images && packageData.images.length > 0) {
            return packageData.images.map(img => img.image_url || img);
        }
        if (packageData?.package_image) {
            return [packageData.package_image];
        }
        return [];
    };

    const getShortDescription = () => {
        if (!packageData?.description) {
            return 'A comprehensive package designed to create your perfect day with elegance and style.';
        }
        const firstLine = packageData.description.split('\n')[0];
        if (firstLine.length > 200) {
            return firstLine.substring(0, 200) + '...';
        }
        return firstLine;
    };

    const getFullDescription = () => {
        if (!packageData?.description) return '';
        const lines = packageData.description.split('\n');
        if (lines.length > 1) {
            return lines.slice(1).join('\n');
        }
        return packageData.description;
    };

    if (loading) {
        return (
            <div className="px-4 py-8 lg:px-6">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Skeleton className="h-96 w-full rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-12 w-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!packageData) {
        return (
            <div className="px-4 py-8 lg:px-6">
                <div className="max-w-xl mx-auto text-center">
                    <Card className="p-8">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Package Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The package you're looking for doesn't exist or has been removed.
                        </p>
                        <Link to="/dashboard/packages">
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Packages
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    const images = getPackageImages();
    const inclusionItems = parseInclusions(packageData.inclusions);

    return (
        <div className="px-4 py-8 lg:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Back Button & Breadcrumb */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="text-gray-600 dark:text-gray-400 hover:text-purple-600"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/dashboard" className="hover:text-purple-600">Dashboard</Link>
                        <span className="mx-2">/</span>
                        <Link to="/dashboard/packages" className="hover:text-purple-600">Packages</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                            {packageData.name}
                        </span>
                    </nav>
                </div>

                {/* Hero Section */}
                <Card className="overflow-hidden mb-8 border-purple-200 dark:border-purple-800">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Image Gallery */}
                        <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-indigo-900/30 p-4 lg:p-6">
                            {images.length > 0 ? (
                                <ImageGallery images={images} packageName={packageData.name} className="rounded-xl overflow-hidden" />
                            ) : (
                                <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                                    <Package className="w-20 h-20 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Package Info */}
                        <div className="p-6 lg:p-8 flex flex-col">
                            <div className="flex-1">
                                {/* Category Badge */}
                                {packageData.category && (
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 mb-3">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {packageData.category} Package
                                    </Badge>
                                )}

                                {/* Title */}
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                    {packageData.name}
                                </h1>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                    {getShortDescription()}
                                </p>

                                {/* Price & Capacity */}
                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Starting at</span>
                                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                            {formatPrice(packageData.price)}
                                        </span>
                                    </div>

                                    {packageData.capacity && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            <Users className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Up to {packageData.capacity} guests
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Venue Info */}
                                {packageData.venue && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6">
                                        <MapPin className="w-4 h-4 text-purple-600" />
                                        <span className="font-medium">{packageData.venue?.name}</span>
                                        {packageData.venue?.location && (
                                            <span className="text-sm">• {packageData.venue.location}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleBookNow}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold"
                                    >
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Book This Package
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleOpenComparison}
                                        className="h-12"
                                    >
                                        <Scale className="w-5 h-5" />
                                    </Button>
                                    <FavoriteButton
                                        itemId={id}
                                        itemType="package"
                                        variant="outline"
                                        className="h-12"
                                    />
                                    <ShareButton
                                        url={window.location.href}
                                        title={packageData.name}
                                        description={getShortDescription()}
                                        variant="outline"
                                        className="h-12"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabbed Content */}
                <Card className="p-6 lg:p-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="gallery">Gallery</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {inclusionItems.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        What's Included
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {inclusionItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
                                            >
                                                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            {getFullDescription() && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        About This Package
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        {getFullDescription()}
                                    </p>
                                </div>
                            )}

                            {/* Virtual Tour */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Play className="w-5 h-5 text-purple-600" />
                                    Virtual Tour
                                </h3>
                                {packageData.venue?.virtual_tour_url || packageData.virtual_tour_url ? (
                                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <iframe
                                            src={packageData.venue?.virtual_tour_url || packageData.virtual_tour_url}
                                            className="w-full h-[400px]"
                                            allow="fullscreen"
                                            title={`Virtual tour of ${packageData.name}`}
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <Play className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">Virtual tour coming soon</p>
                                        <Link to="/contact-us">
                                            <Button variant="outline" size="sm">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Schedule a Tour
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Gallery Tab */}
                        <TabsContent value="gallery">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Package Gallery
                            </h3>
                            {images.length > 0 ? (
                                <ImageGallery images={images} packageName={packageData.name} />
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    No images available for this package.
                                </div>
                            )}
                        </TabsContent>

                        {/* Reviews Tab */}
                        <TabsContent value="reviews">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Customer Reviews
                            </h3>
                            {reviewsLoading ? (
                                <LoadingSpinner variant="section" size="md" text="Loading reviews..." />
                            ) : reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div
                                            key={review.id || review.testimonial_id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0">
                                                    {review.client?.avatar || review.avatar ? (
                                                        <img
                                                            src={review.client?.avatar || review.avatar}
                                                            alt={review.client?.name || review.client_name || 'Reviewer'}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {review.client?.name || review.client_name || 'Anonymous'}
                                                        </h4>
                                                        {review.rating && (
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-4 h-4 ${
                                                                            i < Math.floor(review.rating)
                                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                                : 'fill-gray-300 text-gray-300'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {review.message || review.testimonial || review.review}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p>No reviews yet for this package.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>

                {/* Related Packages */}
                {relatedPackages.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Similar Packages
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedPackages.map((pkg) => (
                                <Link
                                    key={pkg.package_id || pkg.id}
                                    to={`/dashboard/packages/${pkg.package_id || pkg.id}`}
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                        <div className="h-40 overflow-hidden">
                                            <img
                                                src={pkg.package_image || pkg.images?.[0]?.image_url || '/placeholder-package.jpg'}
                                                alt={pkg.package_name || pkg.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {pkg.package_name || pkg.name}
                                            </h4>
                                            <p className="text-purple-600 dark:text-purple-400 font-bold">
                                                {formatPrice(pkg.package_price || pkg.price)}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && packageData && (
                <BookingFormModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    packageData={packageData}
                    onSuccess={handleBookingSuccess}
                />
            )}

            {/* Comparison Modal */}
            {showComparisonModal && (
                <PackageComparison
                    packages={comparisonPackages}
                    onClose={() => setShowComparisonModal(false)}
                    onRemove={handleRemoveFromComparison}
                />
            )}
        </div>
    );
};

export default ClientPackageDetails;
