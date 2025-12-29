import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, Star, ArrowRight, Sparkles } from 'lucide-react';
import { Button, OptimizedImage } from '../ui';

const PackageCard = ({ package: pkg }) => {
  const imageUrl = pkg.images && pkg.images.length > 0 
    ? pkg.images[0].image_url 
    : pkg.package_image;

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

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-500 h-full flex flex-col border border-gray-100 dark:border-gray-700 hover:border-[#5A45F2]/30 dark:hover:border-[#5A45F2]/50 transform hover:-translate-y-2">
      {/* Image Section with Overlay Effects */}
      <Link to={`/packages/${pkg.package_id || pkg.id}`} className="relative block overflow-hidden">
        <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <OptimizedImage
            src={imageUrl}
            alt={pkg.package_name || pkg.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Featured Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] rounded-lg blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xl flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Featured</span>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          {(pkg.category || pkg.package_category) && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-lg">
                {pkg.category || pkg.package_category}
              </div>
            </div>
          )}

          {/* Hover Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-2 text-white">
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-semibold">View Details</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Price and Rating Row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] bg-clip-text text-transparent">
                ₱{formattedPrice}
              </span>
            </div>
            {pkg.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {parseFloat(pkg.rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Package Name */}
        <Link to={`/packages/${pkg.package_id || pkg.id}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-[#5A45F2] dark:group-hover:text-[#7ee5ff] transition-colors duration-200 min-h-[3rem]">
            {pkg.package_name || pkg.name}
          </h3>
        </Link>

        {/* Description if available */}
        {(pkg.description || pkg.package_description) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {pkg.description || pkg.package_description}
          </p>
        )}

        {/* Venue Location */}
        <div className="flex items-start gap-2 mb-4 text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#5A45F2]" />
          <span className="text-sm line-clamp-1">
            {venueName}
          </span>
        </div>

        {/* Event Details */}
        <div className="flex items-center gap-4 mb-5 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
              <Users className="w-4 h-4 text-[#5A45F2]" />
            </div>
            <span className="text-sm font-medium">{capacityValue} guests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
              <Calendar className="w-4 h-4 text-[#5A45F2]" />
            </div>
            <span className="text-sm font-medium">Event Package</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link to={`/packages/${pkg.package_id || pkg.id}`} className="flex-1 group/btn">
            <button className="w-full group/btn flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:shadow-[#5A45F2]/30 transition-all duration-200 transform hover:scale-105">
              <span>View Details</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link to="/contact-us" className="flex-1 group/btn">
            <button className="w-full group/btn flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-[#5A45F2] text-[#5A45F2] dark:text-[#7ee5ff] rounded-lg font-semibold hover:bg-[#5A45F2] hover:text-white dark:hover:bg-[#5A45F2] dark:hover:text-white transition-all duration-200 transform hover:scale-105">
              <span>Inquire</span>
              <Sparkles className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
