import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

const Pagination = ({ 
  currentPage, 
  lastPage, 
  total, 
  perPage, 
  onPageChange, 
  onPerPageChange,
  from,
  to 
}) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  // Calculate page range to show
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (lastPage <= 1) {
    return null; // Don't show pagination if only one page
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Items per page:
        </label>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-white">{from || 0}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-white">{to || 0}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-white">{total}</span> inquiries
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  1 === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                page === currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < lastPage && (
            <>
              {endPage < lastPage - 1 && <span className="px-2 text-gray-500">...</span>}
              <button
                onClick={() => onPageChange(lastPage)}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  lastPage === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {lastPage}
              </button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

// Also export as named export for index.js compatibility
export { Pagination };

// Stub exports for shadcn/ui pagination components (if needed elsewhere)
// These are placeholder exports to prevent import errors
export const PaginationContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const PaginationEllipsis = ({ ...props }) => <span {...props}>...</span>;
export const PaginationItem = ({ children, ...props }) => <div {...props}>{children}</div>;
export const PaginationLink = ({ children, ...props }) => <a {...props}>{children}</a>;
export const PaginationNext = ({ children, ...props }) => <div {...props}>{children || 'Next'}</div>;
export const PaginationPrevious = ({ children, ...props }) => <div {...props}>{children || 'Previous'}</div>;