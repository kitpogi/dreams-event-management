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
  const [imageSrc, setImageSrc] = useState(src || fallback);

  // Update imageSrc when src prop changes
  useEffect(() => {
    if (src) {
      setImageSrc(src);
      setImageError(false);
      setImageLoaded(false);
    } else if (fallback) {
      setImageSrc(fallback);
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(true);
    }
  }, [src, fallback]);

  const handleError = (e) => {
    console.error('Image failed to load:', imageSrc);
    setImageError(true);
    if (onError) {
      onError(e);
    } else if (fallback && e.target.src !== fallback && imageSrc !== fallback) {
      // Try fallback if available
      setImageSrc(fallback);
      setImageError(false);
      setImageLoaded(false);
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // If no src and no fallback, show placeholder immediately
  if (!src && !fallback) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800`}>
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
          <ImageOff className="w-12 h-12" />
          <span className="text-sm font-medium">Image not available</span>
        </div>
      </div>
    );
  }

  // If there's an error and we've tried fallback, show error placeholder
  if (imageError && (!fallback || imageSrc === fallback)) {
    // Check if className has absolute positioning
    const hasAbsolute = className.includes('absolute');
    return (
      <div className={`${hasAbsolute ? className : `${className} relative`} flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800`}>
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
          <ImageOff className="w-12 h-12" />
          <span className="text-sm font-medium">Image not available</span>
        </div>
      </div>
    );
  }

  // Check if className has absolute positioning
  const hasAbsolute = className.includes('absolute');
  
  // If using absolute positioning, render without wrapper
  if (hasAbsolute) {
    return (
      <>
        {/* Loading skeleton - always visible until image loads */}
        {!imageLoaded && !imageError && (
          <div className={`${className} animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800`} />
        )}
        
        {/* Actual image */}
        {imageSrc && (
          <img
            src={imageSrc}
            alt={alt}
            loading={loading}
            onError={handleError}
            onLoad={handleLoad}
            className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            {...props}
          />
        )}
      </>
    );
  }
  
  // Otherwise, use relative wrapper
  return (
    <div className="relative w-full h-full">
      {/* Loading skeleton - always visible until image loads */}
      {!imageLoaded && !imageError && (
        <div className={`${className} absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800`} />
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          loading={loading}
          onError={handleError}
          onLoad={handleLoad}
          className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;

