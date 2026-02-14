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
  const getPageNumbers = () => {
    const totalPages = lastPage || 1;
    const pageNumbers = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  if (lastPage <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl mt-4">
      {/* Items per page and status */}
      <div className="flex flex-col">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Pagination Status</p>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Showing <span className="text-gray-900 dark:text-white font-bold">{from || ((currentPage - 1) * perPage) + 1}</span> to <span className="text-gray-900 dark:text-white font-bold">{to || Math.min(currentPage * perPage, total)}</span> of <span className="text-gray-900 dark:text-white font-bold">{total}</span> entries
          </div>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-10 h-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 mx-1">
          {getPageNumbers().map((num, idx) => (
            num === '...' ? (
              <span key={`sep-${idx}`} className="px-2 text-gray-400 font-bold select-none">···</span>
            ) : (
              <button
                key={`page-${num}`}
                onClick={() => onPageChange(num)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all border ${currentPage === num
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white shadow-sm'
                  }`}
              >
                {num}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="flex items-center justify-center w-10 h-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
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