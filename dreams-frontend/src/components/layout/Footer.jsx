import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { ParticlesBackground, AnimatedBackground } from '../features';

const Footer = () => {
  return (
    <footer id="footer" className="w-full bg-[#0a0a1a]/95 backdrop-blur-xl transition-colors duration-300 relative overflow-hidden pt-20" role="contentinfo">
      {/* Footer Background Effects - Synchronized */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.1} blur={true} />
        <ParticlesBackground particleCount={8} particleColor="rgba(126, 229, 255, 0.2)" speed={0.04} interactive={false} />
      </div>

      {/* Decorative Orbs & Gradients for Blending */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5A45F2]/40 to-transparent shadow-[0_-5px_20px_rgba(90,69,242,0.3)]" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#5A45F2] opacity-10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7ee5ff] opacity-5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full py-16 px-8 md:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col items-start gap-6">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-4 text-white group"
            >
              <div className="relative w-14 h-14 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl rounded-2xl bg-white/5 border border-white/10 p-2">
                <img src={logo} alt="D'Dreams Logo" className="w-full h-full object-contain filter drop-shadow-sm brightness-110" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-serif text-2xl font-black leading-tight tracking-tight uppercase">
                  D&apos;Dreams
                </h2>
                <span className="text-[10px] font-bold text-[#7ee5ff] uppercase tracking-[0.3em]">Events and Styles</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-light italic">
              "Curating high-end experiences that define your most precious moments with pure elegance and visionary design. We transform your dreams into breathtaking reality."
            </p>
          </div>

          {/* Links Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-50">Quick Navigation</h3>
            <nav className="grid grid-cols-2 gap-y-4 gap-x-8">
              <Link
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-bold text-gray-400 hover:text-[#7ee5ff] transition-all flex items-center gap-2 group/link"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A45F2] scale-0 group-hover/link:scale-100 transition-transform" />
                Home
              </Link>
              <Link to="/services" className="text-sm font-bold text-gray-400 hover:text-[#7ee5ff] transition-all flex items-center gap-2 group/link">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A45F2] scale-0 group-hover/link:scale-100 transition-transform" />
                Services
              </Link>
              <Link to="/portfolio" className="text-sm font-bold text-gray-400 hover:text-[#7ee5ff] transition-all flex items-center gap-2 group/link">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A45F2] scale-0 group-hover/link:scale-100 transition-transform" />
                Portfolio
              </Link>
              <Link to="/set-an-event" className="text-sm font-bold text-gray-400 hover:text-[#7ee5ff] transition-all flex items-center gap-2 group/link">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A45F2] scale-0 group-hover/link:scale-100 transition-transform" />
                Start Planning
              </Link>
            </nav>
          </div>

          {/* Social Column */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-50">Follow Our Journey</h3>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-800 hover:text-white transition-all duration-500 hover:scale-110 shadow-lg group">
                <svg aria-hidden="true" className="h-6 w-6 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-500 hover:scale-110 shadow-lg group">
                <svg aria-hidden="true" className="h-6 w-6 group-hover:-rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.147 2 12.315 2zm-1.161 1.043c-1.06.048-1.656.21-2.164.405a2.863 2.863 0 00-1.05.715 2.863 2.863 0 00-.715 1.05c-.195.508-.357 1.104-.405 2.164-.048 1.024-.06 1.35-.06 3.63s.012 2.606.06 3.63c.048 1.06.21 1.656.405 2.164a2.863 2.863 0 00.715 1.05 2.863 2.863 0 001.05.715c.508.195 1.104.357 2.164.405 1.024.048 1.35.06 3.63.06s2.606-.012 3.63-.06c1.06-.048 1.656-.21 2.164-.405a2.863 2.863 0 001.05-.715 2.863 2.863 0 00.715-1.05c.195-.508.357-1.104.405-2.164.048-1.024.06-1.35.06-3.63s-.012-2.606-.06-3.63c-.048-1.06-.21-1.656-.405-2.164a2.863 2.863 0 00-.715-1.05 2.863 2.863 0 00-1.05-.715c-.508-.195-1.104-.357-2.164-.405C15.244 3.055 14.918 3.043 12 3.043h-1.161zM12 6.845a5.155 5.155 0 100 10.31 5.155 5.155 0 000-10.31zm0 1.84a3.315 3.315 0 110 6.63 3.315 3.315 0 010-6.63zM16.965 6.575a1.23 1.23 0 11-2.46 0 1.23 1.23 0 012.46 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              © {new Date().getFullYear()} D&apos;Dreams Events and Styles.
            </p>
            <div className="hidden md:block w-px h-3 bg-white/10" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
              Crafted for Visionaries
            </p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-3 bg-gradient-to-r from-[#5A45F2] to-[#7ee5ff] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#5A45F2]/20 hover:shadow-[#5A45F2]/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group border border-white/20"
          >
            <span>Elevate to Top</span>
            <svg className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

