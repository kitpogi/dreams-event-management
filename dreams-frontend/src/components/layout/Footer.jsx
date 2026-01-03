import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer id="footer" className="w-full bg-[#FFF7F0] dark:bg-gray-900 border-t border-[#e7dbcf] dark:border-gray-800 transition-colors duration-300" role="contentinfo">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-[#1f2933] dark:text-gray-200">
            <div className="size-6 text-[#5A45F2]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="font-serif text-lg font-bold leading-tight tracking-tight">
              D&apos;Dreams Events and Styles
            </h2>
          </div>
          <p className="text-sm text-[#4b5563] dark:text-gray-400">
            © {new Date().getFullYear()} D&apos;Dreams Events and Styles. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              className="text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] dark:hover:text-[#7ee5ff] transition-colors"
              href="#"
              aria-label="Facebook"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  fillRule="evenodd"
                />
              </svg>
            </a>
            <a
              className="text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] dark:hover:text-[#7ee5ff] transition-colors"
              href="#"
              aria-label="Instagram"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.147 2 12.315 2zm-1.161 1.043c-1.06.048-1.656.21-2.164.405a2.863 2.863 0 00-1.05.715 2.863 2.863 0 00-.715 1.05c-.195.508-.357 1.104-.405 2.164-.048 1.024-.06 1.35-.06 3.63s.012 2.606.06 3.63c.048 1.06.21 1.656.405 2.164a2.863 2.863 0 00.715 1.05 2.863 2.863 0 001.05.715c.508.195 1.104.357 2.164.405 1.024.048 1.35.06 3.63.06s2.606-.012 3.63-.06c1.06-.048 1.656-.21 2.164-.405a2.863 2.863 0 001.05-.715 2.863 2.863 0 00.715-1.05c.195-.508.357-1.104.405-2.164.048-1.024.06-1.35.06-3.63s-.012-2.606-.06-3.63c-.048-1.06-.21-1.656-.405-2.164a2.863 2.863 0 00-.715-1.05 2.863 2.863 0 00-1.05-.715c-.508-.195-1.104-.357-2.164-.405C15.244 3.055 14.918 3.043 12 3.043h-1.161zM12 6.845a5.155 5.155 0 100 10.31 5.155 5.155 0 000-10.31zm0 1.84a3.315 3.315 0 110 6.63 3.315 3.315 0 010-6.63zM16.965 6.575a1.23 1.23 0 11-2.46 0 1.23 1.23 0 012.46 0z"
                  fillRule="evenodd"
                />
              </svg>
            </a>
            <a
              className="text-[#4b5563] dark:text-gray-400 hover:text-[#5A45F2] dark:hover:text-[#7ee5ff] transition-colors"
              href="#"
              aria-label="Pinterest"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.545 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.344-.595-2.2-2.316-2.2-3.858 0-3.033 2.201-5.85 6.33-5.85 3.432 0 6.015 2.43 6.015 5.452 0 3.422-2.156 6.138-5.19 6.138-.992 0-1.932-.529-2.24-1.147l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.96.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

