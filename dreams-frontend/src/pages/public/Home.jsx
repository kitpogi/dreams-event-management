import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Calendar, Award, Star, ArrowRight, CheckCircle, Users, ChevronLeft, ChevronRight, Phone, MessageCircle, Lightbulb, Palette, PartyPopper, ShoppingCart, Play } from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner, Skeleton, SkeletonPackageCard, SkeletonPortfolioCard, SkeletonTeamCard, OptimizedImage } from '../../components/ui';
import { ParticlesBackground, AnimatedBackground, NewsletterSignup, ScrollReveal, ServiceCard } from '../../components/features';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';
import heroLogo from '../../assets/hero-banner.jpg';
import { getAllServices } from '../../data/services';

// How It Works Steps
const howItWorksSteps = [
  { icon: MessageCircle, title: "Book a Consultation", description: "Schedule a free consultation to discuss your event vision and requirements." },
  { icon: Lightbulb, title: "Share Your Vision", description: "Tell us about your dream event - theme, style, budget, and all the special details." },
  { icon: Palette, title: "We Plan Everything", description: "Our expert team handles all the planning, vendor coordination, and logistics." },
  { icon: PartyPopper, title: "Enjoy Your Event", description: "Relax and enjoy your perfectly executed celebration while we handle everything." }
];

// Team members data
const teamMembers = [
  { initials: 'JD', name: 'Jane Doe', role: 'Founder & Lead Planner', gradient: 'from-[#5A45F2] to-[#7c3aed]' },
  { initials: 'MS', name: 'Maria Santos', role: 'Creative Director', gradient: 'from-[#7ee5ff] to-[#5A45F2]' },
  { initials: 'AC', name: 'Ana Cruz', role: 'Event Coordinator', gradient: 'from-[#7c3aed] to-[#7ee5ff]' },
  { initials: 'RG', name: 'Ramon Garcia', role: 'Decor Specialist', gradient: 'from-[#5A45F2] to-[#7c3aed]' }
];

// Service categories - must match database category values
const serviceCategories = ['All', 'Wedding', 'Debut', 'Birthday', 'Corporate', 'Pageant', 'Anniversary'];

// Cinematic Hero Backgrounds - Moved outside component for stability
const HERO_BACKGROUNDS = [
  { img: '/images/winners.jpg', title: 'Spectacular\nEvents' },
  { img: '/images/winnerss.jpg', title: 'Winning\nMoments' },
  { img: '/images/wedding4.jpg', title: 'Pure\nElegance' },
  { img: '/images/wedding2.jpg', title: 'Timeless\nLove' },
  { img: '/images/stage2026.jpg', title: 'Visionary\nDesign' },
  { img: '/images/debu.jpg', title: 'Grand\nDreams' }
];

const Home = () => {
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', eventType: '', eventDate: '', budget: '', message: '' });
  const [featuredPortfolio, setFeaturedPortfolio] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [dbServices, setDbServices] = useState([]);
  const [dbTeam, setDbTeam] = useState([]);
  const [dbStats, setDbStats] = useState({ happy_clients: 500, events_planned: 1000, years_experience: 15, avg_rating: 4.9 });
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const packagesScrollRef = useRef(null);
  const reviewsRef = useRef(null);

  // Removed top-level scroll animation hooks to prevent whole-page re-renders during scroll

  const heroRef = useRef(null);
  // Removed parallax state to prevent full component re-renders during scroll

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, portfolioRes, reviewsRes, servicesRes, teamRes, statsRes] = await Promise.all([
          api.get('/packages/featured', { params: { limit: 8 } }),
          api.get('/portfolio-items', { params: { featured: true, limit: 6 } }),
          api.get('/testimonials', { params: { featured: true, limit: 6 } }),
          api.get('/services'),
          api.get('/team-members'),
          api.get('/public-stats')
        ]);

        setFeaturedPackages(packagesRes.data.data || packagesRes.data);
        setFeaturedPortfolio(portfolioRes.data.data || portfolioRes.data || []);
        setFeaturedReviews(reviewsRes.data.data || reviewsRes.data || []);
        setDbServices(servicesRes.data.data || servicesRes.data || []);
        setDbTeam(teamRes.data.data || teamRes.data || []);
        setDbStats(statsRes.data.data || statsRes.data || statsRes.data.stats || dbStats);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setPackageLoading(false);
        setPortfolioLoading(false);
        setReviewsLoading(false);
        setLoadingServices(false);
        setLoadingTeam(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Use CSS variable for parallax to avoid React re-renders for every scroll tick
      if (heroRef.current) {
        heroRef.current.style.setProperty('--parallax-offset', `${window.scrollY * 0.5}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'DD';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      const response = await api.post('/contact', {
        name: formData.name, email: formData.email, mobile_number: formData.phone || null,
        event_type: formData.eventType, date_of_event: formData.eventDate || null,
        preferred_venue: 'TBD', budget: formData.budget ? formData.budget.replace(/[^0-9]/g, '') : null, message: formData.message
      });
      if (response.data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', phone: '', eventType: '', eventDate: '', budget: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSetEventClick = () => navigate('/set-an-event');
  const scrollPackages = (dir) => packagesScrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  const nextReview = () => setCurrentReviewIndex((p) => (p + 1) % Math.max(1, featuredReviews.length - 2));
  const prevReview = () => setCurrentReviewIndex((p) => (p - 1 + Math.max(1, featuredReviews.length - 2)) % Math.max(1, featuredReviews.length - 2));

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Carousel timer effect with stable dependencies
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_BACKGROUNDS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] overflow-x-hidden">
      {/* ========== HERO SECTION ========== */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          {HERO_BACKGROUNDS.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-40 z-10' : 'opacity-0 z-0'
                }`}
              style={{
                backgroundImage: `url(${bg.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          {/* Main Overlay for readability and depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent z-0" />
        </div>

        <AnimatedBackground type="mesh" colors={['#5A45F2', '#7c3aed', '#7ee5ff']} speed={0.3} direction="diagonal" blur={false} />
        <ParticlesBackground particleCount={20} particleColor="rgba(122, 69, 242, 0.4)" lineColor="rgba(126, 229, 255, 0.1)" speed={0.2} interactive={false} />

        {/* Floating orbs - optimized by removing animate-pulse and reducing blur to prevent stutter */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute top-20 left-[10%] w-64 h-64 bg-[#5A45F2] opacity-10 rounded-full blur-[60px] will-change-transform"
            style={{ transform: `translateY(calc(var(--parallax-offset, 0px) * 0.4))` }}
          />
          <div
            className="absolute bottom-20 right-[10%] w-80 h-80 bg-[#7ee5ff] opacity-10 rounded-full blur-[80px] will-change-transform"
            style={{ transform: `translateY(calc(var(--parallax-offset, 0px) * -0.4))` }}
          />
        </div>

        <div className="grid lg:grid-cols-2 min-h-screen w-full z-10">
          {/* Left Side: Editorial Content */}
          <div className="flex flex-col justify-center px-8 md:px-20 pt-32 pb-20 bg-[#0a0a1a] relative overflow-hidden">
            {/* Background elements for left side */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[#5A45F2] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-px bg-[#7ee5ff]/50" />
                <span className="text-xs md:text-sm font-bold tracking-[0.5em] uppercase text-[#7ee5ff]">D&apos;Dreams Production</span>
              </div>

              <div className="relative h-40 md:h-56 mb-12">
                {HERO_BACKGROUNDS.map((bg, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 transform ${index === currentBgIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
                      }`}
                  >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white leading-[0.9] tracking-tighter">
                      {bg.title}
                    </h1>
                  </div>
                ))}
              </div>

              <p className="text-xl md:text-2xl text-gray-400 font-light max-w-md mb-12 leading-relaxed">
                Curating high-end experiences that define your most precious moments.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={handleSetEventClick}
                  className="px-10 py-5 bg-[#5A45F2] text-white font-bold rounded-full hover:bg-[#7ee5ff] hover:text-[#0a0a1a] transition-all duration-500 shadow-xl shadow-[#5A45F2]/20"
                >
                  Start Planning
                </button>
                <button
                  onClick={() => navigate('/portfolio')}
                  className="px-10 py-5 bg-transparent text-white font-bold rounded-full border border-white/20 hover:bg-white hover:text-[#0a0a1a] transition-all duration-500"
                >
                  Our Portfolio
                </button>
              </div>

              {/* Trust Badges - Integrated Stats */}
              <div className="mt-12 pt-6 border-t border-white/5">
                <CounterSection dbStats={dbStats} />
              </div>
            </div>
          </div>

          {/* Right Side: Cinematic Carousel */}
          <div className="relative min-h-[50vh] lg:min-h-full overflow-hidden group">
            {HERO_BACKGROUNDS.map((bg, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${index === currentBgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              >
                <div
                  className={`w-full h-full bg-cover bg-center transition-transform [transition-duration:5000ms] ease-out ${index === currentBgIndex ? 'scale-110' : 'scale-100'}`}
                  style={{ backgroundImage: `url(${bg.img})` }}
                />
              </div>
            ))}
            {/* Visual overlay for the image side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a] to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-12 right-12 z-30 flex items-center gap-4">
              <span className="text-white/40 text-sm font-bold tracking-widest">{currentBgIndex + 1} / {HERO_BACKGROUNDS.length}</span>
              <div className="w-12 h-px bg-white/20" />
            </div>
          </div>
        </div>

        {/* Scroll indicator overlay - Refactored to prevent layout shifts */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1.5 backdrop-blur-sm">
            <div className="w-1 h-2 bg-[#7ee5ff] rounded-full animate-[scroll-dot_2s_infinite_ease-in-out]" />
          </div>
        </div>
      </section>


      {/* ========== HOW IT WORKS - Unified Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] border-b border-white/5 relative overflow-hidden">
          {/* Section Background Effects */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#7c3aed', '#5A45F2']} speed={0.1} blur={true} />
            <ParticlesBackground particleCount={8} particleColor="rgba(126, 229, 255, 0.2)" speed={0.05} interactive={false} />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5A45F2] opacity-5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">Simple Process</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Our streamlined 4-step process makes planning your dream event effortless</p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-[#5A45F2]/50 to-transparent" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {howItWorksSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="relative text-center group">
                      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:border-[#5A45F2]/50 transition-all duration-500">
                        <Icon className="w-9 h-9 text-[#7ee5ff]" />
                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">{i + 1}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ========== SERVICES - Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] min-h-[600px] relative overflow-hidden" id="services">
          {/* Section Background Effects - Synchronized */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
            <ParticlesBackground particleCount={8} particleColor="rgba(126, 229, 255, 0.2)" speed={0.05} interactive={false} />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">What We Offer</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Our Premium Services</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Comprehensive event solutions tailored for every occasion</p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {serviceCategories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${activeCategory === cat ? 'bg-[#5A45F2] text-white shadow-lg shadow-[#5A45F2]/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingServices ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#0a0a1a]/80 rounded-2xl overflow-hidden shadow-xl border border-white/5">
                    <Skeleton className="h-56 w-full bg-white/5" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-full bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                    </div>
                  </div>
                ))
              ) : dbServices.length > 0 ? (
                dbServices
                  .filter(service => activeCategory === 'All' || service.category === activeCategory)
                  .length > 0 ? (
                  dbServices
                    .filter(service => activeCategory === 'All' || service.category === activeCategory)
                    .slice(0, 6)
                    .map((service, i) => (
                      <ScrollReveal key={service.id} variant="slide" delay={i * 100}>
                        <ServiceCard service={service} index={i} />
                      </ScrollReveal>
                    ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                      <span className="material-symbols-outlined text-3xl text-gray-500">event_busy</span>
                    </div>
                    <p className="text-gray-400 text-lg">No {activeCategory.toLowerCase()} services available yet.</p>
                    <button
                      onClick={() => setActiveCategory('All')}
                      className="mt-4 text-[#7ee5ff] hover:underline text-sm font-medium"
                    >
                      View all services →
                    </button>
                  </div>
                )
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">No services available from database yet.</div>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ========== POPULAR PACKAGES - Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] min-h-[500px] relative overflow-hidden" id="packages">
          {/* Section Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-20">
              <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
            </div>
            <div className="absolute inset-0 opacity-10">
              <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.4)" speed={0.05} interactive={false} />
            </div>
            {/* Added glowing orbs for that "dreamy" feel */}
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#5A45F2] opacity-5 rounded-full blur-[120px]" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#7ee5ff] opacity-5 rounded-full blur-[140px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">Top Picks</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Popular Packages</h2>
                <p className="text-gray-400 mt-2">Our most loved packages by customers</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollPackages('left')} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all duration-300 border border-white/10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => scrollPackages('right')} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all duration-300 border border-white/10">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {packageLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-80">
                    <SkeletonPackageCard />
                  </div>
                ))}
              </div>
            ) : featuredPackages.length > 0 ? (
              <div ref={packagesScrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {featuredPackages.slice(0, 8).map((pkg) => (
                  <div key={pkg.package_id || pkg.id} className="flex-shrink-0 w-80 bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 group hover:border-[#5A45F2]/40 transition-all duration-500">
                    <div className="relative h-52 overflow-hidden bg-white/5">
                      <OptimizedImage
                        src={pkg.package_image || pkg.image_url || pkg.image}
                        alt={pkg.package_name || pkg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                        fallback="/images/wedding 2.jpg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/20 to-transparent" />

                      {/* Price Badge on Image */}
                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                        <span className="text-white font-bold text-sm">₱{Number(pkg.package_price || pkg.price || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-white mb-1 group-hover:text-[#7ee5ff] transition-colors">{pkg.package_name || pkg.name}</h3>
                        <p className="text-xs font-semibold text-[#7ee5ff] uppercase tracking-wider">{pkg.package_type || 'Premium Package'}</p>
                      </div>

                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed italic">"{pkg.package_description || pkg.description || 'Creating magical moments with elegance and style.'}"</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5A45F2]" />
                          {pkg.bookings_count || 0} Successful Bookings
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Starting at</span>
                          <span className="text-xl font-bold text-white">₱{Number(pkg.package_price || pkg.price || 0).toLocaleString()}</span>
                        </div>
                        <Link to={`/set-an-event?package=${pkg.package_id || pkg.id}`} className="px-5 py-2.5 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white text-sm font-bold rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#5A45F2]/40 transition-all active:scale-95" title="Book this event">
                          Select <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No packages available.</p>
              </div>
            )}

            {/* View All Packages Button */}
            {featuredPackages.length > 0 && (
              <div className="text-center mt-12">
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full hover:bg-[#5A45F2] hover:border-[#5A45F2] transition-all duration-300 group"
                >
                  View All Packages
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ========== PORTFOLIO - Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] min-h-[700px] relative overflow-hidden" id="portfolio">
          {/* Section Background Effects - Synchronized */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#7c3aed', '#5A45F2']} speed={0.1} blur={true} />
            <ParticlesBackground particleCount={12} particleColor="rgba(126, 229, 255, 0.2)" speed={0.08} interactive={false} />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">Our Work</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Portfolio</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">A glimpse into the magical celebrations we&apos;ve created</p>
            </div>

            {portfolioLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonPortfolioCard key={i} />
                ))}
              </div>
            ) : featuredPortfolio.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPortfolio.map((item, i) => (
                    <ScrollReveal key={item.id} variant="scale" delay={i * 100}>
                      <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                        <OptimizedImage
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          src={item.image_url || item.image_path}
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                            {item.description && <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                <div className="flex justify-center mt-12">
                  <Link to="/portfolio" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#5A45F2] text-white font-bold rounded-full shadow-lg shadow-[#5A45F2]/30 hover:shadow-xl hover:scale-105 transition-all">
                    <span>View Full Portfolio</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No portfolio entries yet.</p>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ========== TESTIMONIALS - Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] relative overflow-hidden" id="reviews">
          {/* Section Background Effects */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
            <ParticlesBackground particleCount={10} particleColor="rgba(126, 229, 255, 0.2)" speed={0.06} interactive={false} />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a1a] to-transparent opacity-60" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">Testimonials</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">What Our Customers Say</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Real experiences from our valued clients</p>
            </div>

            {reviewsLoading ? (
              <LoadingSpinner variant="section" size="lg" />
            ) : featuredReviews.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredReviews.slice(currentReviewIndex, currentReviewIndex + 3).map((review, i) => (
                    <div key={review.id} className={`p-6 rounded-2xl transition-all duration-300 ${i === 0 ? 'bg-gradient-to-br from-[#5A45F2] to-[#7c3aed] text-white shadow-xl shadow-[#5A45F2]/20' : 'bg-white/5 border border-white/10'}`}>
                      <p className={`leading-relaxed mb-6 ${i === 0 ? 'text-white/90' : 'text-gray-300'}`}>&quot;{review.message}&quot;</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-white/20 text-white' : 'bg-[#5A45F2] text-white'}`}>
                          {review.avatar_url ? <img src={review.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(review.client_name)}
                        </div>
                        <div>
                          <p className={`font-bold ${i === 0 ? 'text-white' : 'text-white'}`}>{review.client_name}</p>
                          <p className={`text-sm ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>{review.event_type || 'Event Client'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3 mt-10">
                  <button onClick={prevReview} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all border border-white/10">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextReview} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#5A45F2] hover:text-white transition-all border border-white/10">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No testimonials yet.</p>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ========== TEAM - Dark Background ========== */}
      <ScrollReveal variant="fade">
        <section className="py-24 bg-[#0a0a1a] min-h-[600px] relative overflow-hidden">
          {/* Section Background Effects - Synchronized */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.1} blur={true} />
            <ParticlesBackground particleCount={8} particleColor="rgba(126, 229, 255, 0.2)" speed={0.05} interactive={false} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-[#5A45F2]/5 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-[#5A45F2]/20 text-[#7ee5ff] text-sm font-semibold rounded-full mb-4 border border-[#5A45F2]/30">Our Experts</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Meet Our Team</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Talented event specialists dedicated to making your celebrations unforgettable</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingTeam ? (
                [...Array(4)].map((_, i) => (
                  <SkeletonTeamCard key={i} />
                ))
              ) : dbTeam.length > 0 ? (
                dbTeam.slice(0, 4).map((member, i) => (
                  <ScrollReveal key={member.id} variant="slide" delay={i * 100}>
                    <div className={`group text-center`}>
                      <div className="relative mb-5 aspect-[4/5] rounded-3xl overflow-hidden bg-white/5 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                        <OptimizedImage
                          src={member.image_url || member.image}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          fallback="/images/maam.jpg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <div className={`w-12 h-1 bg-gradient-to-r ${member.gradient || 'from-[#5A45F2] to-[#7c3aed]'} rounded-full mb-2`} />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-white">{member.name}</h3>
                      <p className="text-[#5A45F2] text-sm font-medium">{member.role}</p>
                    </div>
                  </ScrollReveal>
                ))
              ) : (
                teamMembers.map((member, i) => (
                  <ScrollReveal key={i} variant="slide" delay={i * 100}>
                    <div className={`group text-center`}>
                      <div className="relative mb-5 aspect-[4/5] rounded-3xl overflow-hidden bg-white/5 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                        <OptimizedImage
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <div className={`w-12 h-1 bg-gradient-to-r ${member.gradient} rounded-full mb-2`} />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-white">{member.name}</h3>
                      <p className="text-[#5A45F2] text-sm font-medium">{member.role}</p>
                    </div>
                  </ScrollReveal>
                ))
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade">
        <section className="py-28 bg-[#0a0a1a] relative overflow-hidden" id="contact">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.1} blur={true} />
            <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.4)" speed={0.05} interactive={false} />
            <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#5A45F2] opacity-5 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-[#7ee5ff] opacity-5 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 bg-white/5 backdrop-blur-sm text-[#7ee5ff] text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6 border border-white/10 shadow-lg">Inquiry</span>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tighter">
                Let&apos;s Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5A45F2] to-[#7ee5ff]">Something Iconic</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                Whether it&apos;s a grand celebration or an intimate gathering, we transform your vision into a breathtaking reality.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Contact Info Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {[
                  { icon: Phone, title: 'Call Us', value: '+63 9XX XXX XXXX', subtitle: 'Mon-Sun, 9am - 6pm', color: 'bg-blue-500/10 text-blue-400' },
                  { icon: MessageCircle, title: 'Email Us', value: 'hello@ddreams.com', subtitle: 'Average response: 4h', color: 'bg-purple-500/10 text-purple-400' },
                  { icon: Calendar, title: 'Main Office', value: 'Cavite, Philippines', subtitle: 'By appointment only', color: 'bg-cyan-500/10 text-cyan-400' }
                ].map((item, i) => (
                  <div key={i} className="group p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-[#5A45F2]/40 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.title}</h4>
                        <p className="text-white font-bold">{item.value}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-8 bg-gradient-to-br from-[#5A45F2]/20 to-[#7ee5ff]/10 rounded-3xl border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Social Connection</h3>
                  <p className="text-sm text-gray-400 mb-6 font-light">Join our community of over 5k happy dreamers and get daily inspiration.</p>
                  <div className="flex gap-3">
                    {['FB', 'IG'].map((social) => (
                      <button key={social} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black text-white transition-all uppercase tracking-widest border border-white/10">
                        {social}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Form */}
              <div className="lg:col-span-8">
                {submitSuccess ? (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-xl border border-[#5A45F2]/30 rounded-[40px] text-center">
                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Vision Received</h3>
                    <p className="text-gray-400">Our planners are already reviewing your request. Expect a call shortly.</p>
                    <button onClick={() => setSubmitSuccess(false)} className="mt-8 text-sm font-bold text-[#7ee5ff] uppercase tracking-[0.2em] hover:underline">Send another inquiry</button>
                  </div>
                ) : (
                  <form className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-2xl relative" onSubmit={handleSubmit}>
                    {submitError && (
                      <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {submitError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                        <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                        <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Phone Number</label>
                        <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+63 9XX XXX XXXX" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Event Date</label>
                        <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all [color-scheme:dark]" name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Event Category</label>
                        <select className="w-full px-6 py-4 bg-[#0d0d1e] border border-white/10 rounded-2xl text-white focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all appearance-none cursor-pointer" name="eventType" value={formData.eventType} onChange={handleChange} required>
                          <option value="">Select Category</option>
                          <option value="wedding">Wedding Ceremony</option>
                          <option value="debut">Grand Debut</option>
                          <option value="birthday">Birthday Bash</option>
                          <option value="corporate">Corporate Event</option>
                          <option value="other">Bespoke Event</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Estimated Budget</label>
                        <select className="w-full px-6 py-4 bg-[#0d0d1e] border border-white/10 rounded-2xl text-white focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all appearance-none cursor-pointer" name="budget" value={formData.budget} onChange={handleChange}>
                          <option value="">Select Range</option>
                          <option value="below-50k">Below ₱50k</option>
                          <option value="50k-100k">₱50k - ₱100k</option>
                          <option value="100k-200k">₱100k - ₱200k</option>
                          <option value="above-200k">Above ₱200k</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 mb-10">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">The Dream Details</label>
                      <textarea className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:border-[#5A45F2] focus:ring-4 focus:ring-[#5A45F2]/10 outline-none transition-all resize-none" name="message" rows="4" value={formData.message} onChange={handleChange} placeholder="Share your vision, color palettes, or specific requests..." required />
                    </div>

                    <button type="submit" disabled={submitting} className="w-full py-5 bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-[#5A45F2]/30 hover:shadow-[#5A45F2]/50 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      {submitting ? <><LoadingSpinner size="sm" className="text-white" /> Planning...</> : <>Send Vision <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Divider line between Contact and Newsletter */}
      <div className="bg-[#0a0a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      <NewsletterSignup />

      {/* WhatsApp - Using CSS-contained animation to prevent layout recalculations */}
      <a href="https://wa.me/639XXXXXXXXX" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 group" style={{ contain: 'layout' }}>
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 bg-green-500 rounded-full opacity-40"
            style={{
              animation: 'whatsapp-pulse 2s ease-in-out infinite',
              willChange: 'opacity',
            }}
          />
          <div className="absolute inset-0 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Phone className="w-6 h-6 text-white" />
          </div>
        </div>
        <style>{`
          @keyframes whatsapp-pulse {
            0%, 100% { opacity: 0; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.3); }
          }
        `}</style>
      </a>
    </div >
  );
};

const CounterSection = ({ dbStats, className = "" }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const happyClients = useCounterAnimation(dbStats?.happy_clients || 500, 2000, isVisible);
  const eventsPlanned = useCounterAnimation(dbStats?.events_planned || 1000, 2000, isVisible);
  const yearsExp = useCounterAnimation(dbStats?.years_experience || 15, 2000, isVisible);
  const avgRating = useCounterAnimation(dbStats?.avg_rating || 4.9, 2000, isVisible);

  const stats = [
    { icon: Users, value: `${happyClients}+`, label: 'Clients' },
    { icon: Calendar, value: `${eventsPlanned}+`, label: 'Events' },
    { icon: Award, value: `${yearsExp}+`, label: 'Years' },
    { icon: Star, value: `${avgRating}`, label: 'Rating' },
  ];

  return (
    <div ref={ref} className={`flex flex-wrap items-center gap-x-8 gap-y-6 ${className}`}>
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="flex flex-col group py-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Icon className="w-4 h-4 text-[#7ee5ff] group-hover:scale-110 transition-transform duration-300" />
              <div className="text-xl font-serif font-black text-white group-hover:text-[#7ee5ff] transition-colors">{stat.value}</div>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors ml-6">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Home;
