import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, OptimizedImage, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, ShareButton, FavoriteButton, FAQ, Button } from '../../components/ui';
import { BookingFormModal, AuthModal } from '../../components/modals';
import ImageGallery from '../../components/features/ImageGallery';
import PackageComparison from '../../components/features/PackageComparison';
import PackageCard from '../../components/features/PackageCard';
import { AnimatedBackground } from '../../components/features';
import { Star, User, Scale, ExternalLink, Play } from 'lucide-react';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
      // Try to fetch package-specific reviews first
      const response = await api.get('/reviews', {
        params: { package_id: id }
      });
      const reviewsData = response.data.data || response.data || [];
      
      // If no package-specific reviews, fetch general testimonials
      if (reviewsData.length === 0) {
        const testimonialResponse = await api.get('/testimonials', {
          params: { limit: 10 }
        });
        setReviews(testimonialResponse.data.data || testimonialResponse.data || []);
      } else {
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to testimonials
      try {
        const testimonialResponse = await api.get('/testimonials', {
          params: { limit: 10 }
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
          per_page: 10
        }
      });
      const packages = response.data.data || response.data || [];
      // Filter out current package and limit to 3
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

  const handleAddToComparison = (pkg) => {
    const packageId = pkg.package_id || pkg.id;
    // Check if current package is already in comparison
    const currentPackageInComparison = comparisonPackages.find(
      p => (p.package_id || p.id) === id
    );
    
    // Add current package if not already added
    let updatedPackages = [...comparisonPackages];
    if (!currentPackageInComparison) {
      updatedPackages.push(packageData);
    }
    
    // Add selected package if not already in comparison
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
    // Ensure current package is in comparison
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
      toast.error('No packages to compare. Add packages to comparison first.');
    }
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
      return packageData.images.map(img => img.image_url || img);
    }
    if (packageData?.package_image) {
      return [packageData.package_image];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f5ff] dark:bg-[#1c1022] py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
            {/* Content Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
              </div>
            </div>
          </div>
        </div>
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#f9f5ff] via-white to-[#fce7ff] dark:from-[#120818] dark:via-[#1c1022] dark:to-[#140014] font-display text-gray-800 dark:text-gray-200">
      {/* Animated Background - Subtle waves */}
      <AnimatedBackground 
        type="waves"
        colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
        speed={0.4}
        className="opacity-10 dark:opacity-5"
      />
      <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* ========== BREADCRUMB NAVIGATION ========== */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
              <Link
                to="/"
                className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 transition-colors"
              >
                Home
              </Link>
              <span className="text-gray-400" aria-hidden="true">/</span>
              <Link
                to="/packages"
                className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 transition-colors"
              >
                Packages
              </Link>
              {packageData.category && (
                <>
                  <span className="text-gray-400" aria-hidden="true">/</span>
                  <Link
                    to={`/packages?category=${packageData.category}`}
                    className="text-gray-500 dark:text-gray-400 font-medium hover:text-[#a413ec] hover:underline underline-offset-4 capitalize transition-colors"
                  >
                    {packageData.category} Packages
                  </Link>
                </>
              )}
              <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[160px] sm:max-w-xs" aria-current="page">
                / {packageData.name}
              </span>
            </div>
          </nav>

          {/* ========== HERO SECTION ========== */}
          <section className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-purple-100/70 dark:border-gray-800 rounded-3xl shadow-xl shadow-purple-100/40 dark:shadow-black/40 overflow-hidden mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              
              {/* Hero Content */}
              <article className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <header>
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

                  {/* Package Info Badges */}
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

                  {/* Venue Info */}
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
                </header>

                {/* Action Buttons */}
                <footer className="mt-4">
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

                    <div className="flex items-center gap-2">
                      <FavoriteButton
                        itemId={id}
                        itemType="package"
                        variant="outline"
                        size="default"
                        className="h-11 rounded-2xl border-gray-200 dark:border-gray-700"
                      />
                      <ShareButton
                        url={window.location.href}
                        title={packageData.name}
                        description={getShortDescription()}
                        variant="outline"
                        size="default"
                        className="h-11 rounded-2xl border-gray-200 dark:border-gray-700"
                        customText="Share"
                      />
                      <Button
                        onClick={handleOpenComparison}
                        variant="outline"
                        size="default"
                        className="h-11 rounded-2xl border-gray-200 dark:border-gray-700"
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Compare
                      </Button>
                    </div>

                    <Link
                      to="/packages"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-11 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/80 border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">arrow_back</span>
                      Back to all packages
                    </Link>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    No commitment on enquiry — we'll help you personalize every detail before you confirm your booking.
                  </p>
                </footer>
              </article>

              {/* Hero Image Gallery */}
              <aside className="relative bg-gradient-to-br from-[#f6e8ff] via-[#fde4ff] to-[#ffe8f4] dark:from-[#2a1035] dark:via-[#311644] dark:to-[#3c0b3e] overflow-hidden rounded-2xl p-4">
                <ImageGallery images={images} packageName={packageData.name} className="h-full" />
              </aside>
            </div>
          </section>

          {/* ========== MAIN CONTENT AREA ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Tabbed Content */}
            <main className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {inclusionItems.length > 0 && (
                    <section className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                      <header className="flex items-center justify-between gap-3 mb-6">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                            What&apos;s Included
                          </h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Curated elements designed to cover all the essentials of your celebration.
                          </p>
                        </div>
                        <span className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#a413ec]/10 text-[#a413ec]">
                          <span className="material-symbols-outlined">checklist</span>
                        </span>
                      </header>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {inclusionItems.map((item, index) => {
                          const formatted = formatInclusionItem(item);
                          return (
                            <article
                              key={index}
                              className="group flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 px-3.5 py-3.5 sm:px-4 sm:py-4 hover:border-[#a413ec]/40 hover:bg-white dark:hover:bg-gray-900 transition-colors"
                            >
                              <div className="flex-shrink-0 text-[#a413ec] pt-0.5">
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                                  {formatted.title}
                                </h3>
                                {formatted.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    {formatted.description}
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-6 space-y-6">
                  {getFullDescription() && (
                    <section className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                      <header className="mb-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          About This Package
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Dive deeper into everything that is thoughtfully planned and coordinated for your event.
                        </p>
                      </header>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                          {getFullDescription()}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Virtual Tour Section */}
                  <section className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                    <header className="mb-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#a413ec]/30">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          Virtual Tour
                        </h2>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Explore our venue and package offerings through an immersive virtual experience.
                      </p>
                    </header>
                    <div className="space-y-4">
                      {packageData.venue?.virtual_tour_url || packageData.virtual_tour_url ? (
                        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                          <iframe
                            src={packageData.venue?.virtual_tour_url || packageData.virtual_tour_url}
                            className="w-full h-[400px] sm:h-[500px]"
                            allow="fullscreen"
                            title={`Virtual tour of ${packageData.name}`}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <div className="text-center p-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg">
                              <Play className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              Virtual Tour Coming Soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                              We're working on bringing you an immersive virtual tour experience. In the meantime, feel free to contact us for a personalized venue tour.
                            </p>
                            <Link to="/contact-us">
                              <Button className="bg-[#a413ec] hover:bg-[#9010d0] text-white">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Schedule a Tour
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery" className="mt-6">
                  <section className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                    <header className="mb-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Package Gallery
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Explore all images from this package.
                      </p>
                    </header>
                    {images.length > 0 ? (
                      <ImageGallery images={images} packageName={packageData.name} />
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No images available for this package.
                      </div>
                    )}
                  </section>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-6">
                  <section className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                    <header className="mb-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Customer Reviews
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        See what our clients have to say about this package.
                      </p>
                    </header>

                    {reviewsLoading ? (
                      <LoadingSpinner variant="section" size="md" text="Loading reviews..." />
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <article
                            key={review.id || review.testimonial_id}
                            className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-[#a413ec]/40 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {review.client?.avatar || review.avatar ? (
                                  <img
                                    src={review.client?.avatar || review.avatar}
                                    alt={review.client?.name || review.client_name || 'Reviewer'}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-[#a413ec]/10 flex items-center justify-center">
                                    <User className="w-6 h-6 text-[#a413ec]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <header className="flex items-center justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                      {review.client?.name || review.client_name || 'Anonymous'}
                                    </h3>
                                    {review.rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < Math.floor(review.rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                                            }`}
                                          />
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                          {review.rating.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {review.created_at && (
                                    <time className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </time>
                                  )}
                                </header>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {review.message || review.testimonial || review.review}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                          <Star className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>No reviews yet. Be the first to review this package!</p>
                      </div>
                    )}
                  </section>
                </TabsContent>
              </Tabs>
            </main>

            {/* Right Column: Sidebar */}
            <aside className="space-y-4">
              
              {/* Package Summary Card */}
              <section className="bg-white/95 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-purple-100/70 dark:border-purple-900/70 shadow-lg shadow-purple-100/50 dark:shadow-black/60 p-5 sm:p-6">
                <header className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Package Summary
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      At-a-glance details for quick decision-making.
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#a413ec]/10 text-[#a413ec]">
                    <span className="material-symbols-outlined text-lg">sparkles</span>
                  </span>
                </header>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Starting Price</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(packageData.price)}
                    </dd>
                  </div>

                  {packageData.category && (
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <dt className="text-gray-500 dark:text-gray-400">Occasion</dt>
                      <dd>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 capitalize">
                          <span className="material-symbols-outlined text-sm">celebration</span>
                          {packageData.category}
                        </span>
                      </dd>
                    </div>
                  )}

                  {packageData.capacity && (
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <dt className="text-gray-500 dark:text-gray-400">Guest Capacity</dt>
                      <dd className="font-medium text-gray-800 dark:text-gray-100">
                        Up to {packageData.capacity} guests
                      </dd>
                    </div>
                  )}

                  {packageData.venue?.name && (
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="text-gray-500 dark:text-gray-400">Primary Venue</dt>
                      <dd className="font-medium text-right text-gray-800 dark:text-gray-100 line-clamp-2">
                        {packageData.venue.name}
                      </dd>
                    </div>
                  )}
                </dl>

                <footer className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Need adjustments? Our team can tailor this package to match your exact preferences — from decor to
                    guest count and timeline.
                  </p>
                </footer>
              </section>

              {/* FAQ Section */}
              <section className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-900/90 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-3xl border border-purple-200/50 dark:border-purple-800/50 shadow-xl shadow-purple-100/30 dark:shadow-purple-900/20 p-6 sm:p-8 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#a413ec]/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl -ml-12 -mb-12" aria-hidden="true"></div>
                
                <div className="relative z-10">
                  <header className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a413ec] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#a413ec]/30">
                        <span className="material-symbols-outlined text-white text-lg">help</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#a413ec] to-[#7c3aed] bg-clip-text text-transparent">
                        Frequently Asked Questions
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-[52px]">
                      Everything you need to know about this package
                    </p>
                  </header>

                  <FAQ
                    items={[
                      {
                        id: '1',
                        question: 'What is included in this package?',
                        answer: packageData.inclusions 
                          ? `This package includes: ${parseInclusions(packageData.inclusions).slice(0, 3).join(', ')}${parseInclusions(packageData.inclusions).length > 3 ? ' and more.' : '.'}`
                          : 'Please contact us for detailed information about what is included in this package.',
                      },
                      {
                        id: '2',
                        question: 'Can I customize this package?',
                        answer: 'Yes! Our team can tailor this package to match your exact preferences. Contact us to discuss customization options, including decor, guest count, timeline adjustments, and additional services.',
                      },
                      {
                        id: '3',
                        question: 'What is the maximum guest capacity?',
                        answer: packageData.capacity 
                          ? `This package can accommodate up to ${packageData.capacity} guests. If you need to accommodate more guests, please contact us to discuss options.`
                          : 'Please contact us to discuss guest capacity options for your event.',
                      },
                      {
                        id: '4',
                        question: 'How far in advance should I book?',
                        answer: 'We recommend booking at least 3-6 months in advance to ensure availability, especially for popular dates. However, we can accommodate last-minute bookings subject to availability.',
                      },
                      {
                        id: '5',
                        question: 'What is the cancellation policy?',
                        answer: 'Cancellation policies vary depending on the booking date and package. Please contact us for specific cancellation terms and conditions. We aim to be flexible and work with you to find the best solution.',
                      },
                      {
                        id: '6',
                        question: 'Do you offer payment plans?',
                        answer: 'Yes, we offer flexible payment plans to make your event planning easier. Typically, we require a deposit to secure your booking, with the balance due closer to your event date. Contact us to discuss payment options.',
                      },
                    ]}
                    type="single"
                    allowMultiple={false}
                    variant="modern"
                    showIcons={true}
                    className="w-full"
                  />

                  <footer className="mt-6 pt-6 border-t border-purple-200/50 dark:border-purple-800/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Still have questions?{' '}
                      <Link
                        to="/contact-us"
                        className="font-semibold text-[#a413ec] hover:text-[#7c3aed] dark:text-[#7c3aed] dark:hover:text-[#a413ec] transition-colors underline underline-offset-2"
                      >
                        Contact us
                      </Link>
                      {' '}and we'll be happy to help!
                    </p>
                  </footer>
                </div>
              </section>
            </aside>
          </div>

          {/* ========== RELATED PACKAGES SECTION ========== */}
          {relatedPackages.length > 0 && (
            <section className="mt-12">
              <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md shadow-purple-100/40 dark:shadow-black/40">
                <header className="mb-6">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Related Packages
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Explore similar packages that might interest you
                      </p>
                    </div>
                    <Link
                      to={`/packages?category=${packageData.category}`}
                      className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#a413ec] hover:text-[#9010d0] transition-colors"
                    >
                      View All
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </header>

                {relatedPackagesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-4">
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedPackages.map((pkg) => (
                      <PackageCard
                        key={pkg.package_id || pkg.id}
                        package={pkg}
                        onAddToComparison={handleAddToComparison}
                        viewMode="grid"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6 text-center sm:hidden">
                  <Link
                    to={`/packages?category=${packageData.category}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#a413ec] hover:text-[#9010d0] transition-colors"
                  >
                    View All {packageData.category} Packages
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}
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
      <PackageComparison
        packages={comparisonPackages.length > 0 ? comparisonPackages : (packageData ? [packageData] : [])}
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onRemove={handleRemoveFromComparison}
      />
    </div>
  );
};

export default PackageDetails;
