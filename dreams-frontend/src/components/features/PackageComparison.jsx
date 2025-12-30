import { useState, useEffect } from 'react';
import { X, Check, X as XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button, Badge } from '../ui';
import { OptimizedImage } from '../ui';

const PackageComparison = ({ packages, isOpen, onClose, onRemove }) => {
  const [selectedPackages, setSelectedPackages] = useState(packages || []);

  // Sync internal state with packages prop when it changes
  useEffect(() => {
    if (packages && packages.length > 0) {
      setSelectedPackages(packages);
    } else {
      setSelectedPackages([]);
    }
  }, [packages]);

  const handleRemove = (packageId) => {
    const updated = selectedPackages.filter(p => (p.package_id || p.id) !== packageId);
    setSelectedPackages(updated);
    if (onRemove) {
      onRemove(packageId);
    }
    if (updated.length === 0) {
      onClose();
    }
  };

  const getValue = (pkg, key) => {
    return pkg[key] || pkg[`package_${key}`] || 'N/A';
  };

  const getPrice = (pkg) => {
    const price = parseFloat(pkg.package_price || pkg.price || 0);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getRating = (pkg) => {
    return pkg.rating ? parseFloat(pkg.rating).toFixed(1) : 'N/A';
  };

  // Don't render if modal is not open or no packages
  if (!isOpen || selectedPackages.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Compare Packages</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 min-w-[200px]">
                    Feature
                  </th>
                  {selectedPackages.map((pkg) => (
                    <th key={pkg.package_id || pkg.id} className="p-4 text-center min-w-[250px] relative">
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(pkg.package_id || pkg.id)}
                          className="absolute top-2 right-2 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={pkg.images?.[0]?.image_url || pkg.package_image}
                            alt={getValue(pkg, 'name')}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                          {getValue(pkg, 'name')}
                        </h3>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Price
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#5A45F2] to-[#7c3aed] bg-clip-text text-transparent">
                        ₱{getPrice(pkg)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Rating
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center">
                      <span className="text-lg font-semibold">{getRating(pkg)}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Category
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center">
                      <Badge variant="secondary" className="capitalize">
                        {getValue(pkg, 'category')}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Venue
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center text-sm">
                      {typeof pkg.venue === 'object' && pkg.venue !== null
                        ? pkg.venue.name || pkg.venue.location || 'N/A'
                        : pkg.venue || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Capacity
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center text-sm">
                      {typeof pkg.capacity === 'object' && pkg.capacity !== null
                        ? pkg.capacity.capacity || 'N/A'
                        : pkg.capacity || 'N/A'} guests
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    Description
                  </td>
                  {selectedPackages.map((pkg) => (
                    <td key={pkg.package_id || pkg.id} className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      <p className="line-clamp-3">
                        {getValue(pkg, 'description')}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageComparison;

