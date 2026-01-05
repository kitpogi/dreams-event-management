import React, { Suspense } from 'react';
import { Skeleton } from './skeleton';
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
    <div className={cn('min-h-screen p-4', className)}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
};

export default LazyRoute;

