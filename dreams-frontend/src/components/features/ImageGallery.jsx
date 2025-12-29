import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '../ui/carousel';
import { Dialog, DialogContent } from '../ui/dialog';
import { OptimizedImage } from '../ui';
import { ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ImageGallery = ({ images = [], packageName = 'Package', className }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={cn('h-full flex flex-col items-center justify-center text-center p-8 gap-3', className)}>
        <span className="material-symbols-outlined text-4xl text-gray-400">image_not_supported</span>
        <p className="text-sm font-medium text-gray-600">No images available</p>
      </div>
    );
  }

  const imageUrls = images.map(img => (typeof img === 'string' ? img : img.image_url || img));

  return (
    <>
      <div className={cn('relative', className)}>
        <Carousel className="w-full">
          <CarouselContent>
            {imageUrls.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative group rounded-2xl overflow-hidden shadow-xl">
                  <OptimizedImage
                    src={image}
                    alt={`${packageName} - Image ${index + 1}`}
                    className="w-full h-[400px] md:h-[500px] object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => {
                      setSelectedImage(image);
                      setZoomOpen(true);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
                      <ZoomIn className="h-4 w-4" />
                      <span>Click to zoom</span>
                    </div>
                  </div>
                  {imageUrls.length > 1 && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      {index + 1} / {imageUrls.length}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {imageUrls.length > 1 && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}
        </Carousel>

        {/* Thumbnail Navigation */}
        {imageUrls.length > 1 && (
          <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-2">
            {imageUrls.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  // Scroll to image in carousel
                  const carousel = document.querySelector('[role="region"][aria-roledescription="carousel"]');
                  if (carousel) {
                    const items = carousel.querySelectorAll('[role="group"]');
                    if (items[index]) {
                      items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }
                }}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-colors group"
              >
                <OptimizedImage
                  src={image}
                  alt={`${packageName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              aria-label="Close zoom"
            >
              <X className="h-6 w-6" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt={`${packageName} - Zoomed view`}
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

