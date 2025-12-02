import { Link } from 'react-router-dom';
import Button from './Button';

const PackageCard = ({ package: pkg }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {pkg.images && pkg.images.length > 0 && (
        <img 
          src={pkg.images[0].image_url} 
          alt={pkg.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{pkg.name}</h3>
        <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{pkg.description}</p>
        <div className="mb-4">
          <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold mr-2">
            ${pkg.price}
          </span>
          <span className="text-gray-500 text-sm">Capacity: {pkg.capacity} guests</span>
        </div>
        <Link to={`/packages/${pkg.id}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </div>
    </div>
  );
};

export default PackageCard;

