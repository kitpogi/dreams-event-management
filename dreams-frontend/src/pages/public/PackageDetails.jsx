import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, OptimizedImage } from '../../components/ui';
import { BookingFormModal, AuthModal } from '../../components/modals';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

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

  const handleEnquire = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleBookingSuccess = () => {
    navigate('/dashboard');
  };

  const handleLoginSuccess = () => {
    setShowBookingModal(true);
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const parseInclusions = (inclusions) => {
    if (!inclusions) return [];
    if (typeof inclusions === 'string') {
      // Try to parse as newline-separated or comma-separated
      const items = inclusions.split(/\n|,/).filter(item => item.trim()).map(item => item.trim());
      return items;
    }
    return Array.isArray(inclusions) ? inclusions : [];
  };

  const getPackageImages = () => {
    if (packageData?.images && packageData.images.length > 0) {
      return packageData.images.map(img => img.image_url || img).slice(0, 3);
    }
    if (packageData?.package_image) {
      return [packageData.package_image];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f5ff] dark:bg-[#1c1022] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-[#f9f5ff] dark:bg-[#1c1022] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Package Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The package you're looking for doesn't exist or has been removed.</p>
          <Link to="/packages">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-[#a413ec] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#a413ec]/90 transition-colors">
              <span className="truncate">Browse Packages</span>
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getPackageImages();
  const inclusionItems = parseInclusions(packageData.inclusions);

  // Format inclusions with descriptions if they contain colons or pipes
  const formatInclusionItem = (item) => {
    if (item.includes(':') || item.includes('|')) {
      const parts = item.split(/[:|]/).map(p => p.trim());
      return {
        title: parts[0],
        description: parts[1] || ''
      };
    }
    return {
      title: item,
      description: ''
    };
  };

  // Get first paragraph of description for hero section
  const getShortDescription = () => {
    if (!packageData.description) {
      return 'A comprehensive package designed to create your perfect day with elegance and style, ensuring every detail is flawlessly executed.';
    }
    const firstLine = packageData.description.split('\n')[0];
    if (firstLine.length > 150) {
      return firstLine.substring(0, 150) + '...';
    }
    return firstLine;
  };

  // Get full description (excluding first line if it was used in hero)
  const getFullDescription = () => {
    if (!packageData.description) return '';
    const lines = packageData.description.split('\n');
    if (lines.length > 1) {
      return lines.slice(1).join('\n');
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] font-display text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-6 text-xs sm:text-sm">
            <Link
              to="/"
              className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to="/packages"
              className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 transition-colors"
            >
              Packages
            </Link>
            {packageData.category && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  to={`/packages?category=${packageData.category}`}
                  className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 capitalize transition-colors"
                >
                  {packageData.category} Packages
                </Link>
              </>
            )}
            <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[160px] sm:max-w-xs">
              / {packageData.name}
            </span>
          </div>

          {/* Hero + Summary */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-purple-100/70 dark:border-gray-800 rounded-3xl shadow-xl shadow-purple-100/40 dark:shadow-black/40 overflow-hidden mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Left: copy */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  {packageData.category && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200/70 dark:border-purple-700/60 text-xs font-semibold uppercase tracking-[0.17em] text-purple-700 dark:text-purple-300 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      {packageData.category} Package
                    </div>
                  )}

                  <h1 className="text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-3">
                    {packageData.name}
                  </h1>

                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mb-6">
                    {getShortDescription()}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 font-semibold">
                        Starting from
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#a413ec]">
                        {formatPrice(packageData.price)}
                      </span>
                    </div>

                    {packageData.capacity && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                        <span className="material-symbols-outlined text-base text-[#a413ec]">groups</span>
                        Up to {packageData.capacity} guests
                      </div>
                    )}
                  </div>

                  {packageData.venue && (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
                        <span className="material-symbols-outlined text-base text-[#a413ec]">location_on</span>
                        <span className="font-semibold">{packageData.venue?.name}</span>
                      </div>
                      {packageData.venue?.location && (
                        <span className="text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                          {packageData.venue.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <button
                      onClick={handleEnquire}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 sm:px-8 h-12 sm:h-14 bg-[#a413ec] text-white text-sm sm:text-base font-semibold tracking-wide shadow-lg shadow-[#a413ec]/30 hover:bg-[#9010d0] hover:shadow-[#a413ec]/40 active:translate-y-[1px] transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">event_available</span>
                      <span className="truncate">
                        {isAuthenticated ? 'Book This Package' : 'Enquire About This Package'}
                      </span>
                    </button>

                    <Link
                      to="/packages"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-11 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/80 border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">arrow_back</span>
                      Back to all packages
                    </Link>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    No commitment on enquiry — we’ll help you personalize every detail before you confirm your booking.
                  </p>
                </div>
              </div>

              {/* Right: imagery */}
              <div className="relative bg-gradient-to-br from-[#f6e8ff] via-[#fde4ff] to-[#ffe8f4] dark:from-[#2a1035] dark:via-[#311644] dark:to-[#3c0b3e] overflow-hidden">
                <div className="absolute inset-0 opacity-40 mix-blend-soft-light pointer-events-none">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />
                  <div className="absolute bottom-0 -left-10 w-48 h-48 rounded-full bg-[#a413ec]/30 blur-3xl" />
                </div>

                {images.length > 0 ? (
                  <div className="relative h-full flex flex-col gap-3 p-5 sm:p-6 lg:p-7">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-purple-200/60 dark:shadow-black/60 flex-1 min-h-[220px]">
                      <OptimizedImage
                        src={images[0]}
                        alt={`${packageData.name} main`}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-200/80">
                            Signature Scene
                          </span>
                          <span className="text-sm font-medium text-white/90 line-clamp-1">
                            A glimpse into your celebration atmosphere
                          </span>
                        </div>
                        {images.length > 1 && (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                            <span className="material-symbols-outlined text-sm">photo_library</span>
                            <span>{images.length} photos</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {images.length > 1 && (
                      <div className="grid grid-cols-2 gap-3">
                        {images.slice(1, 3).map((image, index) => (
                          <div
                            key={index}
                            className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100/70 dark:shadow-black/60 h-28 sm:h-32"
                          >
                            <OptimizedImage
                              src={image}
                              alt={`${packageData.name} - Image ${index + 2}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                    <span className="material-symbols-outlined text-4xl text-white/80">image_not_supported</span>
                    <p className="text-sm font-medium text-white/90">
                      Image preview coming soon
                    </p>
                    <p className="text-xs text-white/80 max-w-xs">
                      This package is fully available even without a gallery — contact us to see sample setups and decor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
            {/* Left column: inclusions + description */}
            <div className="space-y-6">
              {inclusionItems.length > 0 && (
                <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        What&apos;s Included
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Curated elements designed to cover all the essentials of your celebration.
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#a413ec]/10 text-[#a413ec]">
                      <span className="material-symbols-outlined">checklist</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {inclusionItems.map((item, index) => {
                      const formatted = formatInclusionItem(item);
                      return (
                        <div
                          key={index}
                          className="group flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 px-3.5 py-3.5 sm:px-4 sm:py-4 hover:border-[#a413ec]/40 hover:bg-white dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex-shrink-0 text-[#a413ec] pt-0.5">
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                              {formatted.title}
                            </h4>
                            {formatted.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                {formatted.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {getFullDescription() && (
                <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    About This Package
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    Dive deeper into everything that is thoughtfully planned and coordinated for your event.
                  </p>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {getFullDescription()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: quick facts / highlight card */}
            <div className="space-y-4">
              <div className="bg-white/95 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-purple-100/70 dark:border-purple-900/70 shadow-lg shadow-purple-100/50 dark:shadow-black/60 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Package Summary
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      At-a-glance details for quick decision-making.
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#a413ec]/10 text-[#a413ec]">
                    <span className="material-symbols-outlined text-lg">sparkles</span>
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Starting Price</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(packageData.price)}
                    </span>
                  </div>

                  {packageData.category && (
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Occasion</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 capitalize">
                        <span className="material-symbols-outlined text-sm">celebration</span>
                        {packageData.category}
                      </span>
                    </div>
                  )}

                  {packageData.capacity && (
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Guest Capacity</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Up to {packageData.capacity} guests
                      </span>
                    </div>
                  )}

                  {packageData.venue?.name && (
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="text-gray-500 dark:text-gray-400">Primary Venue</span>
                      <span className="font-medium text-right text-gray-800 dark:text-gray-100 line-clamp-2">
                        {packageData.venue.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Need adjustments? Our team can tailor this package to match your exact preferences — from decor to
                    guest count and timeline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookingFormModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        packageId={id}
        packageData={packageData}
        onSuccess={handleBookingSuccess}
      />
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode="login"
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default PackageDetails;
