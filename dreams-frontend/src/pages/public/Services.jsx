import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner, Skeleton } from '../../components/ui';
import { ArrowRight } from 'lucide-react';
import { ParticlesBackground, AnimatedBackground, ServiceCard, ScrollReveal } from '../../components/features';
import { formatAssetUrl } from '../../lib/utils';

// Service categories
const serviceCategories = ['All', 'Wedding', 'Debut', 'Birthday', 'Corporate', 'Pageant', 'Anniversary'];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

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

  const filteredServices = services.filter(
    service => activeCategory === 'All' || service.category === activeCategory
  );

  return (
    <div className="bg-[#020617] min-h-screen relative overflow-hidden selection:bg-indigo-500/30">
      {/* Cinematic Background Engine */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40">
          <AnimatedBackground type="mesh" colors={['#4f46e5', '#0ea5e9', '#7c3aed']} speed={0.1} blur={true} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-indigo-600/10 to-transparent" />
        <ParticlesBackground particleCount={25} particleColor="rgba(99, 102, 241, 0.2)" speed={0.02} interactive={false} />

        {/* Dynamic Glow Orbs */}
        <div className="absolute top-[20%] -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] animate-bounce-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Advanced Hero Narrative */}
        <div className="text-center mb-24 pt-32">
          <ScrollReveal variant="fade" delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                Foundations of Excellence
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slide" delay={200}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
              Curated <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Moments</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade" delay={300}>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              Where technical precision meets artistic vision. Explore our suite of elite services designed to transform your milestones into legendary narratives.
            </p>
          </ScrollReveal>
        </div>

        {/* Tactical Category Navigation */}
        <ScrollReveal variant="fade" delay={400}>
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {serviceCategories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`group relative px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden ${activeCategory === cat
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-200 bg-white/5 border border-white/10'
                  }`}
              >
                {activeCategory === cat && (
                  <div className="absolute inset-0 bg-indigo-600 transition-transform duration-500" />
                )}
                <span className="relative z-10">{cat}</span>
                {activeCategory !== cat && (
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Cinematic Grid System */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/10 h-[500px]">
                <Skeleton className="h-72 w-full bg-indigo-500/5" />
                <div className="p-8 space-y-4">
                  <Skeleton className="h-8 w-3/4 bg-indigo-500/5" />
                  <Skeleton className="h-4 w-full bg-indigo-500/5" />
                  <Skeleton className="h-4 w-2/3 bg-indigo-500/5" />
                  <div className="pt-8 flex justify-between">
                    <Skeleton className="h-12 w-32 rounded-2xl bg-indigo-500/5" />
                    <Skeleton className="h-12 w-12 rounded-full bg-indigo-500/5" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service, i) => (
              <ScrollReveal key={service.id} variant="slide" delay={i * 50}>
                <ServiceCard service={service} index={i} />
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 mb-6 group">
                <span className="material-symbols-outlined text-5xl text-indigo-400 group-hover:rotate-12 transition-transform">
                  sentiment_neutral
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Registry Void</h3>
              <p className="text-slate-400 text-lg mb-8">No {activeCategory.toLowerCase()} services found in the current sector.</p>
              <button
                onClick={() => setActiveCategory('All')}
                className="px-8 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

        {/* Global CTA Integration */}
        {!loading && filteredServices.length > 0 && (
          <ScrollReveal variant="fade" delay={200}>
            <div className="text-center mt-32 p-16 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-3xl rounded-[4rem] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.3),transparent)]" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">Ready to Design Your Legacy?</h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg font-medium leading-relaxed">
                  Every great event starts with a single vision. Let's explore our full package tiers and find your perfect match.
                </p>
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-indigo-600 transition-all duration-500 shadow-2xl shadow-indigo-600/20"
                >
                  Browse Strategic Packages
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default Services;
