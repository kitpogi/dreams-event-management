import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ArrowRight, ChevronDown, Phone, Lightbulb } from 'lucide-react';
import api from '../../api/axios';
import { formatAssetUrl } from '../../lib/utils';

// FAQ Data
const faqData = [
  {
    question: "How far in advance should I book my event?",
    answer: "We recommend booking at least 3-6 months in advance for most events. For weddings and large celebrations, 6-12 months is ideal to ensure we can secure your preferred vendors and venue."
  },
  {
    question: "What types of events do you specialize in?",
    answer: "We specialize in weddings, debuts, birthdays, corporate events, pageants, and other special celebrations. Our team has extensive experience in creating memorable experiences for all types of occasions."
  },
  {
    question: "Do you offer customizable packages?",
    answer: "Absolutely! While we have pre-designed packages, we understand every event is unique. We can customize any package to fit your specific needs, preferences, and budget."
  },
  {
    question: "What is included in your event planning services?",
    answer: "Our services typically include venue coordination, vendor management, timeline creation, day-of coordination, decor setup, and guest management. Specific inclusions vary by package."
  },
  {
    question: "How do payments work?",
    answer: "We typically require a 50% deposit to secure your date, with the remaining balance due 2 weeks before the event. We accept various payment methods for your convenience."
  },
  {
    question: "Can I visit your office for a consultation?",
    answer: "Yes! We offer free initial consultations at our office or via video call. During this meeting, we'll discuss your vision, budget, and how we can bring your dream event to life."
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '' });
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ events_count: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, portfolioRes, servicesRes, statsRes] = await Promise.allSettled([
          api.get('/packages'),
          api.get('/portfolio-items', { params: { featured: true, limit: 10 } }),
          api.get('/services'),
          api.get('/public-stats')
        ]);

        if (packagesRes.status === 'fulfilled') {
          const pkgs = packagesRes.value.data.data || packagesRes.value.data || [];
          console.log('Fetched Packages:', pkgs);
          setFeaturedPackages(pkgs);
        }
        if (portfolioRes.status === 'fulfilled') {
          const portfolio = portfolioRes.value.data.data || portfolioRes.value.data || [];
          console.log('Fetched Portfolio:', portfolio);
          setFeaturedPortfolio(portfolio);
        }
        if (servicesRes.status === 'fulfilled') {
          const servicesData = servicesRes.value.data.data || servicesRes.value.data || [];
          setServices(servicesData);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setStats({ events_count: statsRes.value.data.events_planned || 120 });
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSetEventClick = () => {
    navigate('/set-an-event');
  };

  // Helper to safely get image URL
  const getImageUrl = (path) => {
    // If path is undefined or null or empty string, return null immediately
    if (!path || typeof path !== 'string' || path.trim() === '') return null;

    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;

    // Otherwise format it
    return formatAssetUrl(path);
  };

  // Safe fallback handler
  const handleImageError = (e) => {
    e.target.onerror = null; // prevent infinite loop
    e.target.src = "https://images.unsplash.com/photo-1540575467063-17e6fc8a6a44?auto=format&fit=crop&q=80&w=800";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 font-sans">

      {/* 1. HERO SECTION - Event Management Context */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6 pb-20" id="home">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[600px]">

          {/* Left Column (Stack of 2 Cards) */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full">
            {/* Top Card: CTA */}
            <div className="relative h-[340px] rounded-[2rem] overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Perfect Celebration"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
              <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h2 className="text-3xl font-bold mb-2 leading-tight">
                  Discover More <span className="font-light text-white/80">To Create Your</span><br />
                  Perfect Celebration
                </h2>
                <p className="text-sm text-white/70 mb-6 font-medium">Book Your Dream Event With Us Today.</p>
                <button onClick={handleSetEventClick} className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 group/btn">
                  Plan My Event <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Bottom Card: Stats */}
            <div className="relative flex-1 rounded-[2rem] overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=800"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Successful Events"
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <p className="text-sm font-medium text-white/80 mb-1">Total Events Created</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{stats.events_count > 0 ? stats.events_count.toLocaleString() : '1,250'}</span>
                  <span className="text-xl font-light text-white/60">Memories</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Large Hero Image) */}
          <div className="lg:col-span-7 h-full relative rounded-[2rem] overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Grand Wedding"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-12 left-12 right-12 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-[1.2] mb-4">
                Designing Moments, Creating <br />
                Memories Of A Lifetime
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SPARK IDEAS (Inspiration) */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16" id="portfolio">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 text-indigo-600 font-bold">
              <span className="h-[2px] w-8 bg-current"></span>
              <span className="uppercase tracking-wider text-sm">Start Your Journey</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Inspiration For Your Next Event</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Trending Concepts Among Our Clients</p>
          </div>
          <Link to="/portfolio" className="px-6 py-2 mt-4 md:mt-0 rounded-full border border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
            View Gallery
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPortfolio.slice(0, 2).map((item, i) => (
            <div key={item.id || i} className="relative h-[400px] rounded-[2rem] overflow-hidden group cursor-pointer bg-gray-100 dark:bg-gray-800">
              <img
                src={getImageUrl(item.image) || "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800"}
                onError={handleImageError}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/80 line-clamp-2">{item.description || "A stunning showcase of elegance and creativity."}</p>
              </div>
            </div>
          ))}
          {featuredPortfolio.length === 0 && [1, 2].map(n => (
            <div key={n} className="h-[400px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]"></div>
          ))}
        </div>
      </section>

      {/* 3. BEST PACKAGES (Signature Packages) */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16" id="packages">
        <div className="flex items-center gap-3 mb-2 text-indigo-600 font-bold">
          <span className="h-[2px] w-8 bg-current"></span>
          <span className="uppercase tracking-wider text-sm">Signature Packages</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-2xl">
            Choose A Premier Event Package
          </h2>
          <Link to="/packages" className="px-6 py-2 mt-4 md:mt-0 rounded-full border border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
            View All Packages
          </Link>
        </div>
        <p className="text-gray-500 dark:text-gray-400 -mt-8 mb-10 font-medium">Select a highly acclaimed package to ensure your celebration is stress-free and spectacular.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPackages.slice(0, 3).map((pkg, i) => (
            <div key={pkg.id || i} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-5 bg-gray-100 dark:bg-gray-800">
                <img
                  src={getImageUrl(pkg.images?.[0]) || "https://images.unsplash.com/photo-1540575467063-17e6fc8a6a44?auto=format&fit=crop&q=80&w=800"}
                  onError={handleImageError}
                  alt={pkg.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white text-white hover:text-red-500 transition-all cursor-pointer">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold mb-1">Starting From</p>
                <p className="text-xl font-bold text-red-500 mb-2">₱ {pkg.price?.toLocaleString()}</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{pkg.title}</h3>
                <p className="text-gray-400 text-sm mb-2">{pkg.category || "Full Coordination"} • {pkg.location || "Metro Manila"}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9 (150 Reviews)</span>
                </div>
              </div>
            </div>
          ))}
          {packagesLoading && [1, 2, 3].map(n => (
            <div key={`pkg-skl-${n}`} className="h-[400px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]"></div>
          ))}
        </div>
      </section>

      {/* 4. WEEKEND DEALS (Exclusive Offers) */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16" id="services">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 text-indigo-600 font-bold mb-2">
            <span className="uppercase tracking-wider text-sm">Exclusive Offers</span>
            <span className="h-[2px] w-8 bg-current"></span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Limited Time Services</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Upgrade your event with these premium add-ons at special rates. Perfect for that extra touch of magic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(services.length > 0 ? services.slice(0, 3) : featuredPackages.slice(3, 6)).map((item, i) => (
            <div key={item.id || i} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-5 bg-gray-100 dark:bg-gray-800">
                <img
                  src={getImageUrl(item.images?.[0] || item.image) || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800"}
                  onError={handleImageError}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{item.location || "Custom Setup"}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-500 mb-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.8 (85+ Clients)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-bold text-lg">₱ {(item.price || 5000).toLocaleString()}</span>
                  <span className="text-gray-300 font-bold text-lg line-through">₱ {((item.price || 5000) * 1.2).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOP RECOMMENDED GRID (Themes) */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[450px]">
          {/* Col 1: Text + Small Image */}
          <div className="flex flex-col justify-between h-full gap-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Top-<br />Trending<br />Themes
              </h2>
            </div>
            <div className="relative h-[200px] rounded-[2rem] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1519225468359-2996bc15e55e?auto=format&fit=crop&q=80&w=600"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Garden"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">🌿 Garden</span>
              </div>
              <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black transition-colors">
                <ArrowRight className="w-4 h-4 -rotate-45" />
              </button>
            </div>
          </div>

          {/* Col 2: Tall Image */}
          <div className="h-[450px] rounded-[2rem] overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Classic Wedding"
            />
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">1</div>
              <span className="text-white font-bold text-lg">Grand Ballroom</span>
            </div>
          </div>

          {/* Col 3: Tall Image */}
          <div className="h-[450px] rounded-[2rem] overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&q=80&w=600"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Beach Party"
            />
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white text-[10px] font-bold">2</div>
              <span className="text-white font-bold text-lg">Boho Chic</span>
            </div>
          </div>

          {/* Col 4: Small Image + Text */}
          <div className="flex flex-col justify-between h-full gap-6">
            <div className="relative h-[200px] rounded-[2rem] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Debut"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">✨ Debut</span>
              </div>
              <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/40 transition-colors">
                <ArrowRight className="w-4 h-4 -rotate-45" />
              </button>
            </div>
            <div className="flex-1 flex items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                Discover the most sought-after event styles for 2024. From rustic elegance to modern minimal, we bring your vision to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ & CONTACT */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <button onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)} className="w-full flex items-center justify-between text-left font-bold text-gray-900 dark:text-white">
                  {faq.question}
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === index && <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-black text-white" id="contact">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Planning?</h2>
          <p className="text-gray-400 mb-10 text-lg">Book a free consultation today and let&apos;s make your dream event a reality.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <input
              type="email"
              placeholder="Enter Your Email"
              className="px-6 py-4 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-indigo-500 w-full sm:w-80"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <button onClick={handleSetEventClick} className="px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/639XXXXXXXXX?text=Hi!%20I'm%20interested%20in%20your%20event%20planning%20services."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 right-10 z-50 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-2xl shadow-2xl transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
            <Phone className="w-7 h-7 text-white" />
          </div>
        </div>
      </a>

    </div>
  );
};

export default Home;
