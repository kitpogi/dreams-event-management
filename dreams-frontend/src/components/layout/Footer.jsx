import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Footer = () => {
  return (
    <footer id="footer" className="w-full bg-[#FFF7F0] dark:bg-gray-900 border-t border-[#e7dbcf] dark:border-gray-800 transition-colors duration-300" role="contentinfo">
      <div className="w-full py-12 px-8 md:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col items-start gap-4">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 text-[#1f2933] dark:text-gray-200 group"
            >
              <div className="relative w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
                <img src={logo} alt="D'Dreams Logo" className="w-full h-full object-contain filter drop-shadow-sm brightness-110" />
              </div>
              <h2 className="font-serif text-lg font-bold leading-tight tracking-tight">
                D&apos;Dreams Events and Styles
              </h2>
            </Link>
            <p className="text-sm text-[#4b5563] dark:text-gray-400 max-w-xs leading-relaxed">
              Curating high-end experiences that define your most precious moments with pure elegance and visionary design.
            </p>
          </div>

          {/* Links Column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] transition-colors w-fit"
              >
                Home
              </Link>
              <Link to="/services" className="text-sm text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] transition-colors w-fit">Services</Link>
              <Link to="/portfolio" className="text-sm text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] transition-colors w-fit">Portfolio</Link>
              <Link to="/set-an-event" className="text-sm text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] transition-colors w-fit">Start Planning</Link>
            </nav>
          </div>

          {/* Social Column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#5A45F2]/5 dark:bg-white/5 flex items-center justify-center text-[#4b5563] dark:text-gray-400 hover:bg-[#5A45F2] hover:text-white transition-all duration-300">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#5A45F2]/5 dark:bg-white/5 flex items-center justify-center text-[#4b5563] dark:text-gray-400 hover:bg-[#5A45F2] hover:text-white transition-all duration-300">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.147 2 12.315 2zm-1.161 1.043c-1.06.048-1.656.21-2.164.405a2.863 2.863 0 00-1.05.715 2.863 2.863 0 00-.715 1.05c-.195.508-.357 1.104-.405 2.164-.048 1.024-.06 1.35-.06 3.63s.012 2.606.06 3.63c.048 1.06.21 1.656.405 2.164a2.863 2.863 0 00.715 1.05 2.863 2.863 0 001.05.715c.508.195 1.104.357 2.164.405 1.024.048 1.35.06 3.63.06s2.606-.012 3.63-.06c1.06-.048 1.656-.21 2.164-.405a2.863 2.863 0 001.05-.715 2.863 2.863 0 00.715-1.05c.195-.508.357-1.104.405-2.164.048-1.024.06-1.35.06-3.63s-.012-2.606-.06-3.63c-.048-1.06-.21-1.656-.405-2.164a2.863 2.863 0 00-.715-1.05 2.863 2.863 0 00-1.05-.715c-.508-.195-1.104-.357-2.164-.405C15.244 3.055 14.918 3.043 12 3.043h-1.161zM12 6.845a5.155 5.155 0 100 10.31 5.155 5.155 0 000-10.31zm0 1.84a3.315 3.315 0 110 6.63 3.315 3.315 0 010-6.63zM16.965 6.575a1.23 1.23 0 11-2.46 0 1.23 1.23 0 012.46 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#e7dbcf] dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#4b5563] dark:text-gray-400">
            © {new Date().getFullYear()} D&apos;Dreams Events and Styles. All rights reserved.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-bold text-[#5A45F2] hover:text-[#7c3aed] transition-colors flex items-center gap-2 group"
          >
            Back to Top
            <svg className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

