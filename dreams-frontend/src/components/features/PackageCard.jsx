import { Link } from 'react-router-dom';
import { Button } from '../ui';

const PackageCard = ({ package: pkg }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {(pkg.images && pkg.images.length > 0) || pkg.package_image ? (
        <Link to={`/packages/${pkg.package_id}`}>
          <img 
            src={pkg.images && pkg.images.length > 0 ? pkg.images[0].image_url : pkg.package_image} 
            alt={pkg.package_name || pkg.name}
            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>
      ) : null}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{pkg.package_name || pkg.name}</h3>
        <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{pkg.package_description || pkg.description}</p>
        <div className="mb-4">
          <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold mr-2">
            ₱{parseFloat(pkg.package_price || pkg.price || 0).toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm">Capacity: {pkg.capacity || 'N/A'} guests</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/packages/${pkg.package_id}`} className="flex-1">
            <Button className="w-full">View Details</Button>
          </Link>
          <Link to="/contact-us" className="flex-1">
            <Button className="w-full bg-amber-600 hover:bg-amber-700">Inquire Rates</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;

