import { Link } from 'react-router-dom';
import { getAllServices } from '../../data/services';

const Services = () => {
  const services = getAllServices();

  return (
    <div className="w-full bg-[#f7f6f8] min-h-screen">
      <div className="flex flex-1 justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-6xl flex-col items-center">
          <h2 className="text-[#161118] text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-center">
            Our Services
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-[#7c6189]">
            We offer a range of services to make your event unforgettable. From intimate gatherings to grand celebrations, we&apos;ve got you covered.
          </p>

          <div className="mt-12 grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col gap-4 rounded-xl border border-[#e2dbe6] bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#a413ec]/10">
                  <span className="material-symbols-outlined text-[#a413ec] text-3xl">
                    {service.icon}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[#161118] text-lg font-bold leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-[#7c6189] text-sm">
                    {service.description}
                  </p>
                </div>

                <div className="mt-auto flex justify-center">
                  <Link to={service.link}>
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

