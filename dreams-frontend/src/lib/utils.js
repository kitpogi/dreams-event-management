import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 * @param  {...any} inputs 
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a path into a full URL for images/assets
 * @param {string} path - The relative path or full URL
 * @returns {string} - The full URL
 */
export const formatAssetUrl = (path) => {
  if (!path) return '/assets/placeholder-event.jpg';

  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // If it's a relative path from public folder (starts with /assets or /vite.svg etc)
  // Handle both 'assets/...' and '/assets/...'
  if (path.startsWith('assets') || path.startsWith('/assets') ||
    path.startsWith('vite') || path.startsWith('/vite')) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Otherwise, it's likely a storage path from the backend
  // We need to be careful if VITE_API_BASE_URL is not defined
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const baseURL = apiBase.replace('/api', '');

  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If it already has /storage/, just prepend the baseURL
  if (cleanPath.startsWith('/storage/')) {
    return `${baseURL}${cleanPath}`;
  }

  // Otherwise, prepend /storage/
  return `${baseURL}/storage${cleanPath}`;
};
