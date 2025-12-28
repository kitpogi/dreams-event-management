import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Image Section with Badge */}
        <Link to={`/packages/${pkg.package_id}`}>
          <div className="relative">
            <div className="w-full h-64 overflow-hidden">
              <OptimizedImage
                src={imageUrl}
                alt={pkg.package_name || pkg.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Featured Badge */}
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-lg">
              Featured
            </div>
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Price */}
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ₱{parseFloat(pkg.package_price || pkg.price || 0).toLocaleString()}
          </div>

          {/* Package Name */}
          <Link to={`/packages/${pkg.package_id}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-1 hover:text-blue-600 transition-colors">
              {pkg.package_name || pkg.name}
            </h3>
          </Link>

          {/* Venue Location */}
          <div className="flex items-start gap-2 mb-4 text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm line-clamp-1">
              {venueName}
            </span>
          </div>

          {/* Event Details */}
          <div className="flex items-center gap-5 mb-5 text-gray-700 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">{capacityValue} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Event Package</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto pt-4 border-t border-gray-200">
            <Link to={`/packages/${pkg.package_id}`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Details
              </Button>
            </Link>
            <Link to="/contact-us" className="flex-1">
              <Button className="w-full bg-amber-600 hover:bg-amber-700">
                Inquire Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
  );
};

export default PackageCard;

