import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatAssetUrl } from '../../lib/utils';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#f7f6f8] dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a413ec]"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f7f6f8] dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="flex flex-1 justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-6xl flex-col items-center">
          <h2 className="text-[#161118] dark:text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-center transition-colors duration-300">
            Our Services
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-[#7c6189] dark:text-gray-300 transition-colors duration-300">
            We offer a range of services to make your event unforgettable. From intimate gatherings to grand celebrations, we&apos;ve got you covered.
          </p>

          <div className="mt-12 grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col gap-4 rounded-xl border border-[#e2dbe6] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center shadow-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg mb-2">
                  <img
                    src={formatAssetUrl(service.images?.[0])}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#a413ec]/10 dark:bg-[#a413ec]/20">
                  <span className="material-symbols-outlined text-[#a413ec] dark:text-[#a413ec] text-3xl">
                    {service.icon}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[#161118] dark:text-white text-lg font-bold leading-tight transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-[#7c6189] dark:text-gray-300 text-sm transition-colors duration-300">
                    {service.description}
                  </p>
                </div>

                <div className="mt-auto flex justify-center">
                  <Link to={service.link || '/packages'}>
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#a413ec] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#a413ec]/90 transition-colors">
                      <span className="truncate">Learn More</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
