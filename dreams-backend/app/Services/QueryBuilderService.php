<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Advanced Query Builder Service for standardized filtering, sorting, and pagination.
 *
 * Provides a fluent API for building complex queries with:
 * - Field-based filtering with operators
 * - Multi-field search
 * - Dynamic sorting
 * - Date range filtering
 * - Relationship filtering
 * - Pagination with metadata
 */
class QueryBuilderService
{
    protected Builder $query;
    protected Request $request;
    protected array $allowedFilters = [];
    protected array $allowedSorts = [];
    protected array $searchableFields = [];
    protected array $defaultSort = ['created_at' => 'desc'];
    protected array $includes = [];
    protected int $defaultPerPage = 15;
    protected int $maxPerPage = 100;

    /**
     * Create a new query builder instance.
     */
    public function __construct(?Request $request = null)
    {
        $this->request = $request ?? request();
    }

    /**
     * Start building a query for a model.
     */
    public static function for(string|Builder $subject, ?Request $request = null): self
    {
        $instance = new self($request);

        if (is_string($subject)) {
            $instance->query = $subject::query();
        } else {
            $instance->query = clone $subject;
        }

        return $instance;
    }

    /**
     * Set allowed filter fields.
     */
    public function allowedFilters(array $filters): self
    {
        $this->allowedFilters = $filters;
        return $this;
    }

    /**
     * Set allowed sort fields.
     */
    public function allowedSorts(array $sorts): self
    {
        $this->allowedSorts = $sorts;
        return $this;
    }

    /**
     * Set searchable fields.
     */
    public function searchable(array $fields): self
    {
        $this->searchableFields = $fields;
        return $this;
    }

    /**
     * Set default sort.
     */
    public function defaultSort(string $field, string $direction = 'asc'): self
    {
        $this->defaultSort = [$field => $direction];
        return $this;
    }

    /**
     * Set relationships to eager load.
     */
    public function with(array|string $includes): self
    {
        $this->includes = is_array($includes) ? $includes : [$includes];
        return $this;
    }

    /**
     * Apply all query parameters from the request.
     */
    public function apply(): self
    {
        $this->applyIncludes();
        $this->applyFilters();
        $this->applySearch();
        $this->applySorting();

        return $this;
    }

    /**
     * Apply eager loading.
     */
    protected function applyIncludes(): void
    {
        if (!empty($this->includes)) {
            $this->query->with($this->includes);
        }

        // Also handle request-based includes
        $requestIncludes = $this->request->query('include');
        if ($requestIncludes) {
            $includes = is_string($requestIncludes) 
                ? explode(',', $requestIncludes) 
                : (array) $requestIncludes;
            
            $this->query->with(array_map('trim', $includes));
        }
    }

    /**
     * Apply filters from request.
     */
    protected function applyFilters(): void
    {
        $filters = $this->request->query('filter', []);
        
        // Also check for direct query parameters
        foreach ($this->allowedFilters as $filterConfig) {
            $field = is_array($filterConfig) ? ($filterConfig['field'] ?? $filterConfig[0]) : $filterConfig;
            $type = is_array($filterConfig) ? ($filterConfig['type'] ?? 'exact') : 'exact';
            $column = is_array($filterConfig) ? ($filterConfig['column'] ?? $field) : $field;

            // Check both filter[] and direct parameter
            $value = $filters[$field] ?? $this->request->query($field);

            if ($value === null || $value === '') {
                continue;
            }

            $this->applyFilter($column, $value, $type);
        }
    }

    /**
     * Apply a single filter.
     */
    protected function applyFilter(string $column, mixed $value, string $type = 'exact'): void
    {
        // Handle relationship filters (e.g., 'client.name')
        if (str_contains($column, '.')) {
            $this->applyRelationshipFilter($column, $value, $type);
            return;
        }

        switch ($type) {
            case 'exact':
                $this->applyExactFilter($column, $value);
                break;
            case 'partial':
            case 'like':
                $this->query->where($column, 'LIKE', "%{$value}%");
                break;
            case 'starts_with':
                $this->query->where($column, 'LIKE', "{$value}%");
                break;
            case 'ends_with':
                $this->query->where($column, 'LIKE', "%{$value}");
                break;
            case 'date':
                $this->applyDateFilter($column, $value);
                break;
            case 'date_range':
                $this->applyDateRangeFilter($column, $value);
                break;
            case 'boolean':
                $this->query->where($column, $this->parseBoolean($value));
                break;
            case 'numeric':
                $this->applyNumericFilter($column, $value);
                break;
            case 'in':
                $values = is_array($value) ? $value : explode(',', $value);
                $this->query->whereIn($column, array_map('trim', $values));
                break;
            case 'not_in':
                $values = is_array($value) ? $value : explode(',', $value);
                $this->query->whereNotIn($column, array_map('trim', $values));
                break;
            default:
                $this->applyExactFilter($column, $value);
        }
    }

    /**
     * Apply exact match filter with operator support.
     */
    protected function applyExactFilter(string $column, mixed $value): void
    {
        if (is_array($value)) {
            $this->query->whereIn($column, $value);
            return;
        }

        if (is_string($value)) {
            // Handle comma-separated values
            if (str_contains($value, ',')) {
                $values = array_map('trim', explode(',', $value));
                $this->query->whereIn($column, $values);
                return;
            }

            // Handle null checks
            if (strtolower($value) === 'null') {
                $this->query->whereNull($column);
                return;
            }

            if (strtolower($value) === '!null') {
                $this->query->whereNotNull($column);
                return;
            }

            // Handle operators
            $operators = [
                '>=' => '>=',
                '<=' => '<=',
                '!=' => '!=',
                '<>' => '<>',
                '>' => '>',
                '<' => '<',
            ];

            foreach ($operators as $prefix => $operator) {
                if (str_starts_with($value, $prefix)) {
                    $this->query->where($column, $operator, substr($value, strlen($prefix)));
                    return;
                }
            }
        }

        $this->query->where($column, $value);
    }

    /**
     * Apply date filter.
     */
    protected function applyDateFilter(string $column, mixed $value): void
    {
        if (is_string($value) && str_contains($value, '..')) {
            $this->applyDateRangeFilter($column, $value);
            return;
        }

        $this->query->whereDate($column, $value);
    }

    /**
     * Apply date range filter.
     */
    protected function applyDateRangeFilter(string $column, mixed $value): void
    {
        if (is_array($value)) {
            $from = $value['from'] ?? $value[0] ?? null;
            $to = $value['to'] ?? $value[1] ?? null;
        } elseif (is_string($value) && str_contains($value, '..')) {
            [$from, $to] = explode('..', $value, 2);
        } else {
            return;
        }

        if ($from) {
            $this->query->where($column, '>=', trim($from));
        }

        if ($to) {
            $this->query->where($column, '<=', trim($to));
        }
    }

    /**
     * Apply numeric filter with comparison operators.
     */
    protected function applyNumericFilter(string $column, mixed $value): void
    {
        if (is_string($value)) {
            // Handle range: "100..500"
            if (str_contains($value, '..')) {
                [$min, $max] = explode('..', $value, 2);
                if ($min !== '') {
                    $this->query->where($column, '>=', (float) $min);
                }
                if ($max !== '') {
                    $this->query->where($column, '<=', (float) $max);
                }
                return;
            }

            // Handle operators
            if (preg_match('/^([<>=!]+)(.+)$/', $value, $matches)) {
                $operator = $matches[1];
                $number = (float) $matches[2];
                $validOperators = ['>=', '<=', '!=', '<>', '>', '<', '='];
                
                if (in_array($operator, $validOperators, true)) {
                    $this->query->where($column, $operator, $number);
                    return;
                }
            }
        }

        $this->query->where($column, (float) $value);
    }

    /**
     * Apply relationship filter.
     */
    protected function applyRelationshipFilter(string $column, mixed $value, string $type): void
    {
        [$relation, $field] = explode('.', $column, 2);

        $this->query->whereHas($relation, function (Builder $q) use ($field, $value, $type) {
            $this->applyFilter($field, $value, $type);
        });
    }

    /**
     * Apply search across multiple fields.
     */
    protected function applySearch(): void
    {
        $search = $this->request->query('search') ?? $this->request->query('q');

        if (empty($search) || empty($this->searchableFields)) {
            return;
        }

        $this->query->where(function (Builder $q) use ($search) {
            foreach ($this->searchableFields as $field) {
                if (str_contains($field, '.')) {
                    // Relationship search
                    [$relation, $column] = explode('.', $field, 2);
                    $q->orWhereHas($relation, function (Builder $subQ) use ($column, $search) {
                        $subQ->where($column, 'LIKE', "%{$search}%");
                    });
                } else {
                    $q->orWhere($field, 'LIKE', "%{$search}%");
                }
            }
        });
    }

    /**
     * Apply sorting.
     */
    protected function applySorting(): void
    {
        $sort = $this->request->query('sort') ?? $this->request->query('order_by');

        if (empty($sort)) {
            // Apply default sort
            foreach ($this->defaultSort as $field => $direction) {
                $this->query->orderBy($field, $direction);
            }
            return;
        }

        $sorts = is_string($sort) ? explode(',', $sort) : (array) $sort;

        foreach ($sorts as $sortItem) {
            $sortItem = trim($sortItem);
            $direction = 'asc';

            // Handle "-field" for descending
            if (str_starts_with($sortItem, '-')) {
                $direction = 'desc';
                $sortItem = substr($sortItem, 1);
            }

            // Handle "field:desc" format
            if (str_contains($sortItem, ':')) {
                [$sortItem, $dir] = explode(':', $sortItem, 2);
                $direction = strtolower($dir) === 'desc' ? 'desc' : 'asc';
            }

            // Only allow configured sort fields
            if (empty($this->allowedSorts) || in_array($sortItem, $this->allowedSorts, true)) {
                $this->query->orderBy($sortItem, $direction);
            }
        }
    }

    /**
     * Parse boolean value from various inputs.
     */
    protected function parseBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (bool) $value;
        }

        $truthy = ['true', 'yes', '1', 'on'];
        return in_array(strtolower((string) $value), $truthy, true);
    }

    /**
     * Add a custom filter condition.
     */
    public function whereCustom(callable $callback): self
    {
        $callback($this->query);
        return $this;
    }

    /**
     * Add a where condition.
     */
    public function where(string $column, mixed $operator = null, mixed $value = null): self
    {
        $this->query->where($column, $operator, $value);
        return $this;
    }

    /**
     * Add a where in condition.
     */
    public function whereIn(string $column, array $values): self
    {
        $this->query->whereIn($column, $values);
        return $this;
    }

    /**
     * Set pagination options.
     */
    public function paginate(?int $perPage = null, ?int $maxPerPage = null): self
    {
        if ($perPage !== null) {
            $this->defaultPerPage = $perPage;
        }

        if ($maxPerPage !== null) {
            $this->maxPerPage = $maxPerPage;
        }

        return $this;
    }

    /**
     * Get the underlying query builder.
     */
    public function getQuery(): Builder
    {
        return $this->query;
    }

    /**
     * Execute the query and get results.
     */
    public function get(): Collection
    {
        return $this->query->get();
    }

    /**
     * Execute the query with pagination.
     */
    public function getPaginated(): LengthAwarePaginator
    {
        $perPage = (int) ($this->request->query('per_page') ?? $this->defaultPerPage);
        $perPage = max(1, min($perPage, $this->maxPerPage));

        return $this->query->paginate($perPage);
    }

    /**
     * Get paginated results with metadata.
     */
    public function getWithMeta(): array
    {
        $paginated = $this->getPaginated();

        return [
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
        ];
    }

    /**
     * Get the first result.
     */
    public function first(): ?Model
    {
        return $this->query->first();
    }

    /**
     * Get the count.
     */
    public function count(): int
    {
        return $this->query->count();
    }
}
