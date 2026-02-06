import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, MapPin, Users, Calendar, Star, ArrowRight, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button, OptimizedImage, FavoriteButton } from '../ui';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../ui/carousel';

const QuickViewModal = ({ package: pkg, isOpen, onClose, onFavoriteToggle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const packageUrl = isDashboard
    ? `/dashboard/packages/${pkg.package_id || pkg.id}`
    : `/packages/${pkg.package_id || pkg.id}`;

  const imageUrl = pkg.images && pkg.images.length > 0 
    ? pkg.images[0].image_url 
    : pkg.package_image;

  const images = pkg.images && pkg.images.length > 0
    ? pkg.images.map(img => img.image_url)
    : imageUrl ? [imageUrl] : [];

  const venueName = typeof pkg.venue === 'object' && pkg.venue !== null
    ? pkg.venue.name || pkg.venue.location || 'Dreams Place Event Venue'
    : pkg.venue || 'Dreams Place Event Venue';

  const capacityValue = typeof pkg.capacity === 'object' && pkg.capacity !== null
    ? pkg.capacity.capacity || 'N/A'
    : pkg.capacity || 'N/A';

  const price = parseFloat(pkg.package_price || pkg.price || 0);
  const formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rating = pkg.rating ? parseFloat(pkg.rating) : null;
  const reviewCount = pkg.review_count || pkg.reviews_count || 0;

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white pr-4">
              {pkg.package_name || pkg.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <FavoriteButton
                itemId={pkg.package_id || pkg.id}
                itemType="package"
                onToggle={onFavoriteToggle}
                variant="ghost"
                size="icon"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative">
              {images.length > 1 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={img}
                            alt={`${pkg.package_name || pkg.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={images[0]}
                    alt={pkg.package_name || pkg.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Price and Rating */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] bg-clip-text text-transparent">
                  ₱{formattedPrice}
                </span>
              </div>
              {rating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : i < rating
                            ? 'fill-yellow-200 text-yellow-200'
                            : 'fill-gray-300 text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {rating.toFixed(1)}
                  </span>
                  {reviewCount > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
              )}
            </div>
            {(pkg.category || pkg.package_category) && (
              <div className="bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white px-4 py-1.5 rounded-full text-sm font-semibold capitalize">
                {pkg.category || pkg.package_category}
              </div>
            )}
          </div>

          {/* Description */}
          {(pkg.description || pkg.package_description) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {pkg.description || pkg.package_description}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
                <MapPin className="w-5 h-5 text-[#5A45F2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Venue</p>
                <p className="text-gray-900 dark:text-white font-semibold">{venueName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
                <Users className="w-5 h-5 text-[#5A45F2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</p>
                <p className="text-gray-900 dark:text-white font-semibold">{capacityValue} guests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#5A45F2]/10 dark:bg-[#5A45F2]/20">
                <Calendar className="w-5 h-5 text-[#5A45F2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-gray-900 dark:text-white font-semibold">Event Package</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to={packageUrl} className="flex-1" onClick={onClose}>
              <Button className="w-full group">
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={`/booking/${pkg.package_id || pkg.id}`} className="flex-1" onClick={onClose}>
              <Button variant="outline" className="w-full group">
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                <span>Book Now</span>
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;

