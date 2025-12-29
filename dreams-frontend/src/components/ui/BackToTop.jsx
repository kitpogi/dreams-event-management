import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

const BackToTop = ({
  threshold = 400,
  className,
  showAtBottom = false,
  smooth = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isBottom = windowHeight + scrolled >= documentHeight - 100;

      setIsVisible(scrolled > threshold);
      setIsAtBottom(isBottom);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible && (!showAtBottom || !isAtBottom)) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'rounded-full shadow-lg',
        'bg-gradient-to-br from-[#5A45F2] to-[#7c3aed]',
        'hover:from-[#4a37d8] hover:to-[#6d28d9]',
        'text-white border-0',
        'transition-all duration-300',
        'hover:scale-110 hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-[#5A45F2] focus:ring-offset-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

export default BackToTop;

