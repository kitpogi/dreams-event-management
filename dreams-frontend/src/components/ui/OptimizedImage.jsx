import { useState } from 'react';

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Lazy loading by default
 * - Placeholder while loading
 * - Error fallback
 * - Responsive image support
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallback = '/images/placeholder.jpg',
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = (e) => {
    setImageError(true);
    if (onError) {
      onError(e);
    } else if (fallback && e.target.src !== fallback) {
      e.target.src = fallback;
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${!imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;

