import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Lazy loading by default
 * - Placeholder while loading
 * - Error fallback with icon
 * - Responsive image support
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallback,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper to normalize the image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }

    // Construct the backend URL
    // We assume backend is on port 8000 based on common Laravel setups, 
    // or we can use the relative /storage path if the dev server proxies it.
    const baseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

    // Ensure the path doesn't start with /storage if we're prepending it
    const cleanPath = path.startsWith('/storage/') ? path.replace('/storage/', '') : path;
    const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    return `${baseUrl}/${finalPath}`;
  };

  const [imageSrc, setImageSrc] = useState(getImageUrl(src || fallback));

  // Update imageSrc when src prop changes
  useEffect(() => {
    const normalized = getImageUrl(src || fallback);
    if (normalized) {
      setImageSrc(normalized);
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(true);
    }
  }, [src, fallback]);

  const handleError = (e) => {
    // Prevent infinite loops if fallback also fails
    if (imageError) return;

    if (fallback && imageSrc !== getImageUrl(fallback)) {
      setImageSrc(getImageUrl(fallback));
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(true);
      if (onError) onError(e);
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  // Error state placeholder
  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden`}>
        <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
          <ImageOff className="w-8 h-8 opacity-50" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Missing</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fast loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt || "Image"}
          loading={loading}
          onError={handleError}
          onLoad={handleLoad}
          className={`w-full h-full object-cover transition-all duration-500 transform ${imageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
            }`}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;

