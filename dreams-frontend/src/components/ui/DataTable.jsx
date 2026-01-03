import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './Button';
import { Input } from './Input';
import { Checkbox } from './checkbox';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  FileDown,
  Minus,
  Trash2,
  Edit,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';

const DataTable = ({
  data = [],
  columns = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  filterable = false,
  onFilter,
  pagination = true,
  pageSize = 10,
  selectable = false,
  onSelectionChange,
  exportable = false,
  bulkActions = [],
  getRowId = (row) => row.id || row._id,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const selectAllCheckboxRef = useRef(null);

  // Filter and search
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchable && searchTerm) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessor ? row[col.accessor] : col.render?.(row);
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply custom filter
    if (filterable && onFilter) {
      result = onFilter(result);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = sortConfig.accessor ? a[sortConfig.accessor] : a[sortConfig.key];
        const bValue = sortConfig.accessor ? b[sortConfig.accessor] : b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, filterable, onFilter, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Row selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((row) => getRowId(row)));
      setSelectedRows((prev) => {
        const newSet = new Set([...prev, ...allIds]);
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    } else {
      const currentPageIds = new Set(paginatedData.map((row) => getRowId(row)));
      setSelectedRows((prev) => {
        const newSet = new Set([...prev].filter((id) => !currentPageIds.has(id)));
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    }
  };

  const handleSelectRow = (rowId, checked) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  };

  const isAllSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((row) => selectedRows.has(getRowId(row)));
  }, [paginatedData, selectedRows, getRowId]);

  const isIndeterminate = useMemo(() => {
    const selectedCount = paginatedData.filter((row) => selectedRows.has(getRowId(row))).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, selectedRows, getRowId]);

  // Export functionality
  const exportToCSV = () => {
    const headers = columns.map((col) => col.header || col.accessor || '');
    const rows = filteredData.map((row) =>
      columns.map((col) => {
        const value = col.accessor ? row[col.accessor] : col.render?.(row);
        return value != null ? String(value).replace(/"/g, '""') : '';
      })
    );

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // For Excel export, we'll create a CSV with Excel-compatible format
    // For full Excel support, you'd need a library like xlsx
    exportToCSV();
  };

  // Reset selection when data changes
  useEffect(() => {
    if (data.length === 0) {
      setSelectedRows(new Set());
    }
  }, [data]);

  // Set indeterminate state on checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSort = (column) => {
    if (!column.sortable) return;
    
    setSortConfig((prev) => {
      if (prev.key === column.accessor) {
        return {
          key: column.accessor,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
          accessor: column.accessor,
        };
      }
      return {
        key: column.accessor,
        direction: 'asc',
        accessor: column.accessor,
      };
    });
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column.accessor) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search, Filters, and Export */}
      {(searchable || filterable || exportable || selectable) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            )}
            {filterable && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>Filters applied</span>
              </div>
            )}
            {selectable && selectedRows.size > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          {selectable && selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {bulkActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => {
                        const selectedData = filteredData.filter((row) =>
                          selectedRows.has(getRowId(row))
                        );
                        action.onAction(Array.from(selectedRows), selectedData);
                      }}
                      className={action.destructive ? 'text-red-600 focus:text-red-600' : ''}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {exportable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <div className="relative inline-flex">
                    <Checkbox
                      ref={selectAllCheckboxRef}
                      checked={isAllSelected && !isIndeterminate}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={cn(isIndeterminate && 'data-[state=checked]:bg-transparent')}
                    />
                    {isIndeterminate && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Minus className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                </TableHead>
              )}
              {columns.map((column, columnIndex) => (
                <TableHead
                  key={column.accessor || column.id || `column-${columnIndex}`}
                  className={cn(
                    column.sortable && 'cursor-pointer hover:bg-muted/50',
                    column.className
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row) ?? `row-${rowIndex}`;
                const isSelected = selectedRows.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    className={cn(isSelected && 'bg-muted/50')}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(rowId, checked)}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={`${rowId}-${column.accessor || column.id || columnIndex}`}
                        className={column.cellClassName}
                      >
                        {column.render
                          ? column.render(row, rowIndex)
                          : column.accessor
                          ? row[column.accessor]
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

