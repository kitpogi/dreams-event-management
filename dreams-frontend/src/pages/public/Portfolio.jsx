import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { OptimizedImage } from '../../components/ui';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x600?text=Portfolio';

const Portfolio = () => {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    <div className="w-full bg-[#f7f6f8] dark:bg-gray-900 min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#161118] dark:text-white sm:text-4xl md:text-5xl transition-colors duration-300">
            Our Portfolio
          </h2>
          <p className="max-w-2xl text-base text-gray-600 dark:text-gray-300 sm:text-lg transition-colors duration-300">
            A Glimpse Into Our Creations. Explore the moments we&apos;ve crafted and the dreams we&apos;ve brought to life.
          </p>
        </div>

        {filters.length > 1 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-[#a413ec] text-white ring-2 ring-[#a413ec] ring-offset-2 ring-offset-[#f7f6f8] dark:ring-offset-gray-900'
                    : 'border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#161118] dark:text-gray-200 hover:bg-[#a413ec]/10 dark:hover:bg-[#a413ec]/20 shadow-sm hover:shadow-lg transition-all duration-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 w-full">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[4/3] rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12 transition-colors duration-300">{error}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12 transition-colors duration-300">
              No portfolio entries found for this filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {filteredItems.map((item) => {
                const imageSrc = item.image_url || item.image_path || FALLBACK_IMAGE;
                return (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-lg">
                    <OptimizedImage
                      className="h-full w-full object-cover aspect-[4/3] transition-transform duration-500 ease-in-out group-hover:scale-105"
                      src={imageSrc}
                      alt={item.title || 'Portfolio item'}
                      fallback={FALLBACK_IMAGE}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <p className="text-xl font-bold text-white">{item.title}</p>
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-200">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;

