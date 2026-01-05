import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Pull-to-refresh component
 * @param {Object} props
 * @param {Function} props.onRefresh - Callback function when refresh is triggered
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {boolean} props.disabled - Disable pull-to-refresh
 * @param {number} props.threshold - Distance in pixels to trigger refresh (default: 80)
 * @param {string} props.className - Additional CSS classes
 */
const PullToRefresh = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      scrollTop = container.scrollTop;
    };

    const handleTouchMove = (e) => {
      if (scrollTop > 0) return; // Don't trigger if already scrolled

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - touchStartY;

      if (deltaY > 0 && scrollTop === 0) {
        e.preventDefault();
        isPullingRef.current = true;
        setIsPulling(true);
        setPullDistance(Math.min(deltaY, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      if (pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      isPullingRef.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, threshold, onRefresh, pullDistance]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto -webkit-overflow-scrolling-touch', className)}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, threshold * 1.5)}px`,
            transform: `translateY(${isRefreshing ? 0 : -100 + pullDistance}px)`,
            opacity: pullProgress,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isRefreshing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
              </>
            ) : (
              <>
                <div
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full transition-transform"
                  style={{
                    transform: `rotate(${pullProgress * 360}deg)`,
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {shouldTrigger ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ paddingTop: isPulling || isRefreshing ? Math.min(pullDistance, threshold * 1.5) : 0 }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

