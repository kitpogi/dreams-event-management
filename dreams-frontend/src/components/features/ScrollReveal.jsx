import { useEffect, useRef, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

/**
 * ScrollReveal component for scroll-triggered animations
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to reveal
 * @param {string} props.variant - Animation variant: 'fade' | 'slide' | 'scale' | 'slide-left' | 'slide-right'
 * @param {number} props.threshold - Intersection threshold (0-1)
 * @param {string} props.rootMargin - Root margin for intersection
 * @param {boolean} props.triggerOnce - Only trigger animation once
 * @param {number} props.delay - Animation delay in ms
 * @param {string} props.className - Additional CSS classes
 */
export const ScrollReveal = ({
  children,
  variant = 'fade',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  delay = 0,
  className,
  ...props
}) => {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (isVisible && !hasRevealed) {
      const timer = setTimeout(() => {
        setHasRevealed(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasRevealed, delay]);

  const variantClasses = {
    fade: 'scroll-reveal-fade',
    slide: 'scroll-reveal',
    scale: 'scroll-reveal-scale',
    'slide-left': 'scroll-reveal-slide-left',
    'slide-right': 'scroll-reveal-slide-right',
  };

  return (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant],
        (isVisible || hasRevealed) && 'revealed',
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;

