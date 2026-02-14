import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { LoadingSpinner, OptimizedImage } from '../../components/ui';
import { AnimatedBackground, ParticlesBackground, ScrollReveal } from '../../components/features';

const Reviews = ({ compact = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/testimonials');
        setReviews(response.data.data || response.data || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
        setError('Unable to load testimonials right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth'
      });
    }
  };

  // Update current index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = 400; // Approximate width of card + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.min(newIndex, Math.max(reviews.length - 1, 0)));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [reviews.length]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className="material-symbols-outlined text-[#FFD700] text-lg"
        style={{ fontVariationSettings: index < rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ));
  };

  return (
    <div className="bg-[#0a0a1a] min-h-screen relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50">
          <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        </div>
        <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.3)" speed={0.03} interactive={false} />
      </div>

      <div className={compact ? "relative z-10 px-0" : "max-w-7xl mx-auto px-6 py-16 relative z-10"}>
        <div className="flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col gap-4 text-center mb-8 pt-24">
            <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full w-fit mx-auto border border-[#5A45F2]/30">
              Client Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Words from Our Happy Couples
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Don't just take our word for it. Here's what our clients have to say about their experience with D'Dreams.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner variant="section" size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-gray-400 max-w-md mx-auto">
                <span className="material-symbols-outlined text-5xl mb-4 block">error</span>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-500">rate_review</span>
              </div>
              <p className="text-gray-400 text-lg">No testimonials found yet.</p>
            </div>
          ) : (
            <>
              {/* Carousel Container */}
              <div className="relative group px-12">
                {/* Left Arrow Button */}
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#5A45F2] transition-all duration-300 border border-white/20 hover:border-[#5A45F2] shadow-lg"
                  aria-label="Scroll left"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {/* Scrollable Reviews */}
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto gap-6 pb-8 px-2 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
                >
                  {reviews.map((review, i) => (
                    <ScrollReveal key={review.id} variant="slide" delay={i * 100} className="flex-shrink-0 snap-center">
                      <div className="w-[350px] md:w-[400px] flex flex-col gap-6 p-8 bg-[#0a0a1a]/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/20 border border-white/5 hover:border-[#5A45F2]/30 transition-all duration-300 group/card relative h-full">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5A45F2]/5 to-transparent rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Quote Icon */}
                        <div className="absolute top-6 right-6 text-[#5A45F2]/20 font-serif text-6xl leading-none select-none">"</div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 relative z-10">
                          {renderStars(review.rating)}
                        </div>

                        {/* Review Text */}
                        <p className="text-gray-300 text-lg italic leading-relaxed relative z-10 min-h-[100px]">
                          "{review.message}"
                        </p>

                        {/* Divider */}
                        <div className="w-full h-px bg-white/10 relative z-10"></div>

                        {/* Reviewer */}
                        <div className="flex items-center gap-4 relative z-10">
                          {review.avatar_url ? (
                            <OptimizedImage
                              src={review.avatar_url}
                              alt={review.client_name}
                              className="h-14 w-14 rounded-full object-cover border-2 border-[#5A45F2]/30"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#5A45F2] to-[#7ee5ff] text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-[#5A45F2]/20">
                              {review.client_initials || review.client_name?.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-white text-lg font-bold group-hover/card:text-[#7ee5ff] transition-colors">
                              {review.client_name}
                            </p>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{review.event_type || 'Client'}</p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Right Arrow Button */}
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#5A45F2] transition-all duration-300 border border-white/20 hover:border-[#5A45F2] shadow-lg"
                  aria-label="Scroll right"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center items-center gap-2 mt-4">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const cardWidth = 424; // Width + gap approx
                        scrollContainerRef.current.scrollTo({
                          left: index * cardWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                      ? 'bg-[#7ee5ff] w-8'
                      : 'bg-white/20 hover:bg-white/40 w-2'
                      }`}
                    aria-label={`Go to review ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
