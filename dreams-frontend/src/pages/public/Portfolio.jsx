import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { OptimizedImage, Skeleton } from '../../components/ui';
import { ParticlesBackground, AnimatedBackground, ScrollReveal } from '../../components/features';
import { X } from 'lucide-react';

const FALLBACK_IMAGE = '/images/portfolio.jpg';

const Portfolio = () => {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await api.get('/portfolio-items');
        setItems(response.data.data || response.data || []);
      } catch (err) {
        console.error('Failed to fetch portfolio', err);
        setError('Unable to load the portfolio right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const filters = useMemo(() => {
    const categories = new Set(items.map((item) => item.category).filter(Boolean));
    return ['All', ...categories];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'All') {
      return items;
    }
    return items.filter((item) => item.category === activeFilter);
  }, [items, activeFilter]);

  return (
    <div className="bg-[#0a0a1a] min-h-screen relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50">
          <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        </div>
        <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.3)" speed={0.03} interactive={false} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-24">
          <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">
            Our Work
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Portfolio</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A glimpse into our creations. Explore the moments we&apos;ve crafted and the dreams we&apos;ve brought to life.
          </p>
        </div>

        {/* Category Filters */}
        {filters.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${activeFilter === filter
                  ? 'bg-[#5A45F2] text-white shadow-lg shadow-[#5A45F2]/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-[#0a0a1a]/80 rounded-2xl overflow-hidden shadow-xl border border-white/5">
                  <Skeleton className="aspect-[4/3] w-full bg-white/5" />
                  <div className="p-4">
                    <Skeleton className="h-5 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-full mt-2 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-gray-400 max-w-md mx-auto">
                <span className="material-symbols-outlined text-5xl mb-4 block">error</span>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-500">photo_library</span>
              </div>
              <p className="text-gray-400 text-lg">No portfolio entries found for this filter.</p>
              <button
                onClick={() => setActiveFilter('All')}
                className="mt-4 text-[#7ee5ff] hover:underline text-sm font-medium"
              >
                View all items →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, i) => {
                const imageSrc = item.image_url || item.image_path || FALLBACK_IMAGE;
                return (
                  <ScrollReveal key={item.id} variant="slide" delay={i * 80}>
                    <div
                      onClick={() => setSelectedItem(item)}
                      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a1a]/80 cursor-pointer shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-[#5A45F2]/20 transform hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="relative overflow-hidden">
                        <OptimizedImage
                          className="w-full object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-110"
                          src={imageSrc}
                          alt={item.title || 'Portfolio item'}
                          fallback={FALLBACK_IMAGE}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                        {/* Category Badge */}
                        {item.category && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="px-3 py-1.5 bg-[#5A45F2]/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full border border-[#5A45F2]/50 shadow-lg">
                              {item.category}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-xl font-bold text-white group-hover:text-[#7ee5ff] transition-colors">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Border Glow */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5A45F2] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-w-4xl w-full bg-[#0a0a1a] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <OptimizedImage
              className="w-full object-cover max-h-[60vh]"
              src={selectedItem.image_url || selectedItem.image_path || FALLBACK_IMAGE}
              alt={selectedItem.title}
              fallback={FALLBACK_IMAGE}
            />
            <div className="p-8">
              {selectedItem.category && (
                <span className="inline-block px-3 py-1 bg-[#5A45F2]/20 text-[#7ee5ff] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                  {selectedItem.category}
                </span>
              )}
              <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="text-gray-400">{selectedItem.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
