import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, Star, ArrowRight, Sparkles, Eye, Scale } from 'lucide-react';
import { Button, OptimizedImage, FavoriteButton } from '../ui';
import { formatAssetUrl } from '../../lib/utils';

const PackageCard = ({ package: pkg, onQuickView, onAddToComparison, viewMode = 'grid' }) => {
  // Get image URL - handle various data structures
  const imageUrl = (() => {
    // Try images array first
    if (pkg.images && Array.isArray(pkg.images) && pkg.images.length > 0) {
      const firstImage = pkg.images[0];
      if (typeof firstImage === 'string') {
        return formatAssetUrl(firstImage);
      }
      if (firstImage && firstImage.image_url) {
        return formatAssetUrl(firstImage.image_url);
      }
    }
    // Fallback to package_image
    if (pkg.package_image) {
      return formatAssetUrl(pkg.package_image);
    }
    // Try other possible fields
    if (pkg.image_url) {
      return formatAssetUrl(pkg.image_url);
    }
    if (pkg.image) {
      return formatAssetUrl(pkg.image);
    }
    return null;
  })();

  // Debug log to see what we're getting (only if no image found)
  if (!imageUrl) {
    console.warn('No image URL found for package:', pkg.package_name || pkg.name, 'Package data:', pkg);
  }

  // Handle venue - could be object or string
  const venueName = typeof pkg.venue === 'object' && pkg.venue !== null
    ? pkg.venue.name || pkg.venue.location || 'Dreams Place Event Venue'
    : pkg.venue || 'Dreams Place Event Venue';

  // Handle capacity - could be object or number/string
  const capacityValue = typeof pkg.capacity === 'object' && pkg.capacity !== null
    ? pkg.capacity.capacity || 'N/A'
    : pkg.capacity || 'N/A';

  const price = parseFloat(pkg.package_price || pkg.price || 0);
  const formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rating = pkg.rating ? parseFloat(pkg.rating) : null;
  const reviewCount = pkg.review_count || pkg.reviews_count || 0;

  const isListView = viewMode === 'list';

  return (
    <div className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-[#5A45F2]/50 dark:hover:border-[#5A45F2]/60 transition-all duration-300 overflow-hidden h-full flex ${isListView ? 'flex-row' : 'flex-col'}`}>
      {/* Image Section */}
      <Link
        to={`/packages/${pkg.package_id || pkg.id}`}
        className={`relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 ${isListView ? 'w-72 h-64 min-h-[256px]' : 'w-full h-64'
          }`}
      >
        <OptimizedImage
          src={imageUrl}
          alt={pkg.package_name || pkg.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Actions */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <FavoriteButton
            itemId={pkg.package_id || pkg.id}
            itemType="package"
            variant="ghost"
            size="icon"
            className="h-9 w-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 shadow-sm"
          />
        </div>

        {/* Featured Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white px-3 py-1 rounded-md text-xs font-semibold shadow-lg">
            <Sparkles className="w-3 h-3" />
            Featured
          </span>
        </div>

        {/* Category Badge */}
        {(pkg.category || pkg.package_category) && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-medium capitalize shadow-md">
              {pkg.category || pkg.package_category}
            </span>
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className={`flex flex-col flex-1 p-5 gap-4 ${isListView ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm' : ''}`}>
        {/* Header: Price and Rating */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className={`text-2xl font-bold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] bg-clip-text text-transparent ${isListView ? 'drop-shadow-sm' : ''}`}>
              ₱{formattedPrice}
            </div>
            {rating && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : i < rating
                          ? 'fill-yellow-200 text-yellow-200'
                          : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                        }`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-medium ${isListView ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {rating.toFixed(1)}
                </span>
                {reviewCount > 0 && (
                  <span className={`text-xs ${isListView ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    ({reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Package Name */}
        <Link to={`/packages/${pkg.package_id || pkg.id}`} className="group/title">
          <h3 className={`text-lg font-bold line-clamp-2 group-hover/title:text-[#5A45F2] dark:group-hover/title:text-[#7c3aed] transition-colors duration-200 ${isListView
            ? 'text-gray-900 dark:text-white font-extrabold drop-shadow-sm'
            : 'text-gray-900 dark:text-white'
            }`}>
            {pkg.package_name || pkg.name}
          </h3>
        </Link>

        {/* Description */}
        {(pkg.description || pkg.package_description) && (
          <p className={`text-sm line-clamp-2 leading-relaxed ${isListView
            ? 'text-gray-800 dark:text-gray-200 font-medium'
            : 'text-gray-600 dark:text-gray-400'
            }`}>
            {pkg.description || pkg.package_description}
          </p>
        )}

        {/* Venue Location */}
        <div className={`flex items-center gap-2 ${isListView
          ? 'text-gray-800 dark:text-gray-200'
          : 'text-gray-600 dark:text-gray-400'
          }`}>
          <MapPin className={`w-4 h-4 flex-shrink-0 text-[#5A45F2] ${isListView ? 'drop-shadow-sm' : ''}`} />
          <span className={`text-sm line-clamp-1 ${isListView ? 'font-semibold' : ''}`}>
            {venueName}
          </span>
        </div>

        {/* Event Details */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
              <Users className="w-4 h-4 text-[#5A45F2]" />
            </div>
            <span className={`text-sm font-medium ${isListView
              ? 'text-gray-900 dark:text-gray-100 font-semibold'
              : 'text-gray-700 dark:text-gray-300'
              }`}>
              {capacityValue} guests
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
              <Calendar className="w-4 h-4 text-[#5A45F2]" />
            </div>
            <span className={`text-sm font-medium ${isListView
              ? 'text-gray-900 dark:text-gray-100 font-semibold'
              : 'text-gray-700 dark:text-gray-300'
              }`}>
              Package
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-auto pt-4">
          {/* Secondary Actions Row */}
          <div className="flex gap-2">
            {onQuickView && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(pkg);
                }}
                className="flex-1 h-9 border-gray-300 dark:border-gray-600 hover:border-[#5A45F2] hover:bg-[#5A45F2]/5 dark:hover:bg-[#5A45F2]/10 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                <span className="text-sm">Quick View</span>
              </Button>
            )}
            {onAddToComparison && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToComparison(pkg);
                }}
                className="flex-1 h-9 border-gray-300 dark:border-gray-600 hover:border-[#5A45F2] hover:bg-[#5A45F2]/5 dark:hover:bg-[#5A45F2]/10 transition-colors"
              >
                <Scale className="w-4 h-4 mr-1.5" />
                <span className="text-sm">Compare</span>
              </Button>
            )}
          </div>

          {/* Primary Actions Row */}
          <div className="flex gap-2">
            <Link to={`/packages/${pkg.package_id || pkg.id}`} className="flex-1">
              <button className="w-full h-10 flex items-center justify-center gap-2 px-4 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-medium text-sm shadow-sm hover:shadow-md hover:shadow-[#5A45F2]/20 transition-all duration-200 hover:-translate-y-0.5">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link to="/contact-us" className="flex-1">
              <button className="w-full h-10 flex items-center justify-center gap-2 px-4 bg-white dark:bg-gray-900 border border-[#5A45F2] dark:border-[#5A45F2] text-[#5A45F2] dark:text-[#7c3aed] rounded-lg font-medium text-sm hover:bg-[#5A45F2] hover:text-white dark:hover:bg-[#5A45F2] dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5">
                <span>Inquire</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
