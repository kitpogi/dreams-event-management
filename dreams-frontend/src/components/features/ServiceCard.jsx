import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ImageIcon, Star, Sparkles, Plus } from 'lucide-react';
import { OptimizedImage } from '../ui';

// Category-based fallback images for services without uploaded images
const categoryFallbacks = {
    'Wedding': [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800',
    ],
    'Debut': [
        'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800',
    ],
    'Birthday': [
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    ],
    'Corporate': [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800',
    ],
    'Pageant': [
        'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=800',
    ],
    'Anniversary': [
        'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800',
    ],
    'default': [
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800',
    ],
};

const ServiceCard = ({ service, index = 0 }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [autoRotate, setAutoRotate] = useState(true);

    // Get images from service or use category-based fallbacks
    const getImages = () => {
        if (service.images && Array.isArray(service.images) && service.images.length > 0) {
            return service.images;
        }
        if (service.image_url) {
            return [service.image_url];
        }
        const category = service.category || 'default';
        return categoryFallbacks[category] || categoryFallbacks['default'];
    };

    const images = getImages();
    const hasMultipleImages = images.length > 1;

    useEffect(() => {
        if (!hasMultipleImages || isHovered || !autoRotate) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [hasMultipleImages, isHovered, autoRotate, images.length]);

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAutoRotate(false);
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAutoRotate(false);
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <Link
            to={service.link || '/packages'}
            className="group block relative bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all duration-700 shadow-2xl hover:shadow-indigo-500/20 transform hover:-translate-y-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setAutoRotate(true);
            }}
        >
            {/* Cinematic Media Sector */}
            <div className="relative h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950 z-10 pointer-events-none" />

                {/* Image Engine */}
                <div className="relative w-full h-full scale-100 group-hover:scale-110 transition-transform duration-[3000ms] ease-out">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <OptimizedImage
                                src={img}
                                alt={`${service.title} - Layer ${idx + 1}`}
                                className="w-full h-full object-cover"
                                fallback={categoryFallbacks['default'][0]}
                            />
                        </div>
                    ))}
                </div>

                {/* Floating Meta Nodes (Top Level) */}
                <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-center">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{service.category || 'Elite'}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 backdrop-blur-2xl border border-amber-500/20 rounded-2xl shadow-xl">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-amber-300 tracking-tighter">{service.rating || '4.9'}</span>
                    </div>
                </div>

                {/* Tactical Interaction Indicators */}
                {hasMultipleImages && (
                    <div className={`absolute inset-x-8 top-1/2 -translate-y-1/2 z-30 flex items-center justify-between transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={prevImage} className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={nextImage} className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Atmospheric Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent z-10" />
            </div>

            {/* Architectural Content Layer */}
            <div className="px-10 pb-10 relative -mt-20 z-20">
                <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group-hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative Background Flare */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all" />

                    <div className="relative z-10">
                        {/* Dynamic Header Sector */}
                        <div className="flex items-end justify-between mb-6 gap-4">
                            <div className="flex-1">
                                <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 group-hover:text-indigo-400 transition-colors duration-500">
                                    {service.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-[2px] bg-indigo-500 rounded-full" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Milestone</span>
                                </div>
                            </div>

                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white border border-indigo-400/30 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                <span className="material-symbols-outlined text-3xl font-light">
                                    {service.icon || 'auto_awesome'}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-slate-400 mb-8 line-clamp-2 leading-relaxed tracking-wide min-h-[40px]">
                            {service.description || 'Elevating every moment into an extraordinary narrative of elegance and elite execution.'}
                        </p>

                        {/* Control Interface */}
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-9 h-9 rounded-xl border-2 border-slate-900 bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">Verified Options</span>
                            </div>

                            <div className="relative group/btn">
                                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-0 group-hover/btn:opacity-40 transition-opacity" />
                                <div className="relative flex items-center gap-3 px-6 py-3.5 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                                    Launch
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cinematic Signature Footer */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </Link>
    );
};

export default ServiceCard;
