import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h5 className="text-lg font-semibold mb-3">Dreams Events</h5>
            <p className="text-gray-400">Making your dreams come true, one event at a time.</p>
          </div>
          <div>
            <h5 className="text-lg font-semibold mb-3">Quick Links</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-gray-400 hover:text-white transition-colors">
                  Packages
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="text-gray-400 hover:text-white transition-colors">
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-semibold mb-3">Contact</h5>
            <p className="text-gray-400 mb-1">Email: info@dreamsevents.com</p>
            <p className="text-gray-400">Phone: +1 (555) 123-4567</p>
          </div>
        </div>
        <hr className="border-gray-700 my-6" />
        <div className="text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Dreams Events. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

