import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

const Reviews = () => {
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
        className="material-symbols-outlined text-[#FFD700]"
        style={{ fontVariationSettings: index < rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ));
  };

  return (
    <div className="w-full bg-[#f3f0ff] dark:bg-gray-900 min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col gap-4 text-center">
            <h4 className="text-[#7c6189] dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em] transition-colors duration-300">
              What Our Clients Say
            </h4>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white transition-colors duration-300">
              Words from Our Happy Couples
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a413ec]"></div>
            </div>
          ) : error ? (
            <p className="text-center text-gray-500 dark:text-gray-400">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No testimonials found yet.</p>
          ) : (
            <>
              {/* Carousel Container */}
              <div className="relative group">
                {/* Left Arrow Button */}
                <div className="absolute inset-y-0 left-0 z-10 flex items-center">
                  <button
                    onClick={scrollLeft}
                    className="flex items-center justify-center w-10 h-10 -ml-5 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-[#a413ec] hover:text-white opacity-0 group-hover:opacity-100"
                    aria-label="Scroll left"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                </div>

                {/* Scrollable Reviews */}
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-4 -mx-4"
                >
                  <div className="flex items-stretch px-4 gap-8">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex flex-col gap-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 min-w-80 md:min-w-96 flex-shrink-0 transition-colors duration-300"
                      >
                        {/* Star Rating */}
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>

                        {/* Review Text */}
                        <p className="text-slate-600 dark:text-gray-300 text-base italic leading-relaxed transition-colors duration-300">
                          "{review.message}"
                        </p>

                        {/* Divider */}
                        <div className="w-full h-px bg-slate-200 dark:bg-gray-700 transition-colors duration-300"></div>

                        {/* Reviewer */}
                        <div className="flex items-center gap-3">
                          {review.avatar_url ? (
                            <img
                              src={review.avatar_url}
                              alt={review.client_name}
                              className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-gray-700 transition-colors duration-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-[#f3f0ff] dark:bg-[#a413ec]/20 text-[#a413ec] font-semibold flex items-center justify-center transition-colors duration-300">
                              {review.client_initials || review.client_name?.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-slate-800 dark:text-white text-base font-bold transition-colors duration-300">
                              {review.client_name}
                            </p>
                            <p className="text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">{review.event_type || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow Button */}
                <div className="absolute inset-y-0 right-0 z-10 flex items-center">
                  <button
                    onClick={scrollRight}
                    className="flex items-center justify-center w-10 h-10 -mr-5 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-[#a413ec] hover:text-white opacity-0 group-hover:opacity-100"
                    aria-label="Scroll right"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center items-center gap-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const cardWidth = 400; // Approximate width including gap
                        scrollContainerRef.current.scrollTo({
                          left: index * cardWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentIndex
                        ? 'bg-[#a413ec]'
                        : 'bg-slate-300 dark:bg-gray-600 hover:bg-[#a413ec]/50'
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

