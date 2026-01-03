/**
 * Utility functions for handling image URLs
 */

/**
 * Ensures a URL is absolute by prepending the API base URL if needed
 * @param {string|null} url - The URL to process
 * @returns {string|null} - The absolute URL or null
 */
export const ensureAbsoluteUrl = (url) => {
  if (!url) return null;
  
  // If already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  
  // Get API base URL with fallback
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const baseUrl = apiBase.replace('/api', '');
  
  // If relative URL starting with /, prepend API base URL (without /api)
  if (url.startsWith('/')) {
    return baseUrl + url;
  }
  
  // If it's a storage path without leading slash, prepend /storage/
  if (!url.includes('://') && !url.startsWith('/')) {
    return `${baseUrl}/storage/${url}`;
  }
  
  return url;
};

/**
 * Gets the user's initials from their name
 * @param {string} name - The user's full name
 * @param {number} maxLength - Maximum number of initials to return
 * @returns {string} - The initials
 */
export const getInitials = (name, maxLength = 2) => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
};

