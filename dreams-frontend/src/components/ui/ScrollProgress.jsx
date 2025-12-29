import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ScrollProgress = ({
  position = 'top',
  height = 3,
  color = 'from-[#5A45F2] to-[#7c3aed]',
  showOnScroll = true,
  className,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const totalScrollable = documentHeight - windowHeight;
      const progress = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0;
      
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      setIsVisible(showOnScroll ? scrollTop > 100 : true);
    };

    window.addEventListener('scroll', calculateScrollProgress);
    window.addEventListener('resize', calculateScrollProgress);
    
    // Calculate on mount
    calculateScrollProgress();

    return () => {
      window.removeEventListener('scroll', calculateScrollProgress);
      window.removeEventListener('resize', calculateScrollProgress);
    };
  }, [showOnScroll]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 transition-opacity duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      role="progressbar"
      aria-valuenow={scrollProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Scroll progress"
    >
      <div
        className={cn(
          'h-full bg-gradient-to-r transition-all duration-150 ease-out',
          `bg-gradient-to-r ${color}`
        )}
        style={{
          width: `${scrollProgress}%`,
          height: `${height}px`,
        }}
      />
    </div>
  );
};

export default ScrollProgress;

