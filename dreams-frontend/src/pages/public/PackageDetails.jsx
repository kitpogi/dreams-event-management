import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/ui';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      toast.info('Please login to book this package');
      navigate('/login', { state: { from: `/packages/${id}` } });
    } else {
      navigate(`/booking/${id}`);
    }
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
    <div className="min-h-screen bg-[#f9f5ff] dark:bg-[#1c1022] font-display text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap gap-x-2 gap-y-1 p-0 mb-8">
            <Link to="/" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-[#a413ec] transition-colors">
              Home
            </Link>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
            <Link to="/packages" className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-[#a413ec] transition-colors">
              Packages
            </Link>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
            {packageData.category && (
              <>
                <Link to={`/packages?category=${packageData.category}`} className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal hover:text-[#a413ec] transition-colors capitalize">
                  {packageData.category} Packages
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
              </>
            )}
            <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">{packageData.name}</span>
          </div>

          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-gray-900 dark:text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter mb-4">
              {packageData.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
              {getShortDescription()}
            </p>
            <h2 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
              Starting from {formatPrice(packageData.price)}
            </h2>
          </div>

          {/* Image Gallery Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {images.map((image, index) => (
                <img
                  key={index}
                  className="w-full h-64 object-cover rounded-xl shadow-md"
                  alt={`${packageData.name} - Image ${index + 1}`}
                  src={image}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {/* What's Included Section */}
          {inclusionItems.length > 0 && (
            <div className="bg-white dark:bg-gray-900/50 p-8 md:p-12 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">What's Included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {inclusionItems.map((item, index) => {
                  const formatted = formatInclusionItem(item);
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-[#a413ec] pt-1">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{formatted.title}</h4>
                        {formatted.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatted.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Section (if longer description exists) */}
          {getFullDescription() && (
            <div className="bg-white dark:bg-gray-900/50 p-8 md:p-12 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About This Package</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {getFullDescription()}
                </p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="text-center mt-16">
            <button
              onClick={handleEnquire}
              className="flex w-full sm:w-auto mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-[#a413ec] text-white text-lg font-bold leading-normal tracking-wide hover:bg-[#a413ec]/90 transition-transform hover:scale-105 shadow-lg shadow-[#a413ec]/30"
            >
              <span className="truncate">
                {isAuthenticated ? 'Book This Package' : 'Enquire About This Package'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
