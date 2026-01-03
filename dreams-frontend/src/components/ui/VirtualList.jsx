import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * VirtualList component for rendering large lists efficiently
 * Only renders visible items in the viewport
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render each item: (item, index) => ReactNode
 * @param {number} props.itemHeight - Height of each item in pixels (fixed height) or function: (index) => number
 * @param {number} props.containerHeight - Height of the container in pixels
 * @param {number} props.overscan - Number of items to render outside viewport (default: 3)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.containerClassName - CSS classes for the container
 */
export const VirtualList = ({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  className,
  containerClassName,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const isFixedHeight = typeof itemHeight === 'number';

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 };
    }

    let currentOffset = 0;
    let startIdx = 0;
    let endIdx = items.length - 1;

    if (isFixedHeight) {
      // Fixed height calculation
      const fixedHeight = itemHeight;
      const total = items.length * fixedHeight;
      startIdx = Math.max(0, Math.floor(scrollTop / fixedHeight) - overscan);
      endIdx = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / fixedHeight) + overscan
      );
      return {
        startIndex: startIdx,
        endIndex: endIdx,
        totalHeight: total,
        offsetY: startIdx * fixedHeight,
      };
    } else {
      // Variable height calculation (requires measuring)
      // For now, we'll use a simple estimation
      // In production, you might want to use a library like react-window
      const estimatedItemHeight = 50; // Default estimate
      startIdx = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan);
      endIdx = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / estimatedItemHeight) + overscan
      );
      return {
        startIndex: startIdx,
        endIndex: endIdx,
        totalHeight: items.length * estimatedItemHeight,
        offsetY: startIdx * estimatedItemHeight,
      };
    }
  }, [items.length, scrollTop, containerHeight, itemHeight, isFixedHeight, overscan]);

  // Handle scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                style={
                  isFixedHeight
                    ? { height: itemHeight }
                    : undefined
                }
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;

