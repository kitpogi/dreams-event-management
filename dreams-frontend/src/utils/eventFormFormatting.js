// Formatting functions for event form

export const formatPhoneNumber = (value) => {
  const phoneNumber = value.replace(/\D/g, '');
  if (phoneNumber.length <= 3) return phoneNumber;
  if (phoneNumber.length <= 6) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  if (phoneNumber.length <= 10) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

export const formatBudget = (value) => {
  const numValue = value.replace(/[^\d.]/g, '');
  if (!numValue) return '';
  return parseFloat(numValue).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const formatPrice = (price) => {
  if (!price) return 'Price on request';
  return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatMatchScore = (score) => {
  if (!score) return '0%';
  const percentage = Math.round(parseFloat(score) * 100);
  return `${percentage}%`;
};

export const getPackageImage = (pkg) => {
  // Check for package_image first (from recommendation response)
  if (pkg.package_image) {
    return pkg.package_image;
  }
  // Check for images array (from package details)
  if (pkg.images && pkg.images.length > 0) {
    return pkg.images[0].image_url || pkg.images[0];
  }
  return null; // Return null to show placeholder
};

