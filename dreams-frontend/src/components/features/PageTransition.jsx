import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * PageTransition component for smooth page transitions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {string} props.variant - Transition variant: 'fade' | 'slide'
 * @param {number} props.duration - Transition duration in ms
 * @param {string} props.className - Additional CSS classes
 */
export const PageTransition = ({ 
  children, 
  variant = 'fade',
  duration = 300,
  className 
}) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('entering');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exiting');
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entering');
      }, duration / 2);

      return () => clearTimeout(timer);
    } else {
      setTransitionStage('entering');
    }
  }, [location.pathname, displayLocation.pathname, duration]);

  const transitionClasses = {
    fade: transitionStage === 'entering' ? 'page-transition-enter' : 'opacity-0',
    slide: transitionStage === 'entering' ? 'page-transition-slide' : 'opacity-0 translate-x-[-20px]',
  };

  return (
    <div 
      key={displayLocation.pathname}
      className={cn(
        'transition-all',
        transitionClasses[variant],
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        minHeight: 'inherit'
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;

