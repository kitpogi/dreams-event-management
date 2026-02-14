import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground component
 * Creates animated gradient backgrounds with various effects
 * 
 * @param {string} type - Type of animation: 'gradient', 'mesh', 'waves', 'dots', 'grid'
 * @param {string} colors - Comma-separated color values for gradients
 * @param {number} speed - Animation speed (0.1 - 2.0)
 * @param {string} direction - Animation direction: 'horizontal', 'vertical', 'diagonal', 'radial'
 * @param {boolean} blur - Whether to apply blur effect
 * @param {string} className - Additional CSS classes
 */
const AnimatedBackground = ({
  type = 'gradient',
  colors = ['#5A45F2', '#7c3aed', '#7ee5ff'],
  speed = 1,
  direction = 'diagonal',
  blur = false,
  className = ''
}) => {
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (type === 'gradient' || type === 'mesh') {
      let isVisible = true;
      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) observer.observe(containerRef.current);

      const animate = () => {
        if (isVisible) {
          progressRef.current += 0.01 * speed;
          if (progressRef.current >= 1) progressRef.current = 0;

          if (containerRef.current) {
            const angle = progressRef.current * 360;
            containerRef.current.style.setProperty('--gradient-angle', `${angle}deg`);
          }
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        observer.disconnect();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [type, speed]);

  const colorString = Array.isArray(colors) ? colors.join(', ') : colors;

  const getGradientStyle = () => {
    const angle = type === 'gradient' ? 'var(--gradient-angle, 45deg)' : '45deg';

    switch (direction) {
      case 'horizontal':
        return `linear-gradient(90deg, ${colorString})`;
      case 'vertical':
        return `linear-gradient(180deg, ${colorString})`;
      case 'radial':
        return `radial-gradient(circle, ${colorString})`;
      case 'diagonal':
      default:
        return `linear-gradient(${angle}, ${colorString})`;
    }
  };

  const baseClasses = `absolute inset-0 ${blur ? 'blur-3xl' : ''} ${className}`;

  switch (type) {
    case 'mesh':
      return (
        <div ref={containerRef} className={`${baseClasses} opacity-30`}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(var(--gradient-angle, 45deg), ${colorString})`,
              backgroundSize: '200% 200%',
              animation: `mesh-animation ${10 / speed}s ease-in-out infinite`
            }}
          />
          <style>{`
            @keyframes mesh-animation {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      );

    case 'waves':
      return (
        <div className={`${baseClasses} overflow-hidden`}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                {Array.isArray(colors) ? colors.map((color, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                )) : <stop offset="0%" stopColor={colors} />}
              </linearGradient>
            </defs>
            <path
              d="M0,160 C320,300,420,300,840,160 L840,500 L0,500 Z"
              fill="url(#wave-gradient)"
              opacity="0.3"
              style={{
                animation: `wave-animation ${8 / speed}s ease-in-out infinite`
              }}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -840 0; 0 0"
                dur={`${8 / speed}s`}
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      );

    case 'dots':
      return (
        <div className={`${baseClasses} opacity-20`}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, ${colors[0] || '#5A45F2'} 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              animation: `dots-move ${20 / speed}s linear infinite`
            }}
          />
          <style>{`
            @keyframes dots-move {
              0% { background-position: 0 0; }
              100% { background-position: 50px 50px; }
            }
          `}</style>
        </div>
      );

    case 'grid':
      return (
        <div className={`${baseClasses} opacity-10`}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${colors[0] || '#5A45F2'} 1px, transparent 1px),
                linear-gradient(90deg, ${colors[0] || '#5A45F2'} 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: `grid-move ${15 / speed}s linear infinite`
            }}
          />
          <style>{`
            @keyframes grid-move {
              0% { background-position: 0 0; }
              100% { background-position: 50px 50px; }
            }
          `}</style>
        </div>
      );

    case 'gradient':
    default:
      return (
        <div
          ref={containerRef}
          className={`${baseClasses} opacity-30`}
          style={{
            backgroundImage: getGradientStyle(),
            backgroundSize: type === 'gradient' ? '200% 200%' : '100% 100%',
            animation: type === 'gradient' ? `gradient-shift ${10 / speed}s ease infinite` : 'none'
          }}
        >
          <style>{`
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>
      );
  }
};

export default AnimatedBackground;

