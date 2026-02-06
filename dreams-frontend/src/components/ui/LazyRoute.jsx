import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { cn } from '@/lib/utils';

/**
 * LazyRoute wrapper component for lazy-loaded routes
 * Provides loading fallback with Suspense
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.component - Lazy-loaded component
 * @param {React.ReactNode} props.fallback - Optional custom fallback component
 * @param {string} props.className - Additional CSS classes for container
 */
export const LazyRoute = ({ 
  component: Component, 
  fallback,
  className 
}) => {
  const defaultFallback = (
    <div className={cn('min-h-screen', className)}>
      <LoadingSpinner variant="page" size="lg" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
};

export default LazyRoute;

