<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Trait for adding standardized filtering, sorting, and searching to Eloquent models.
 *
 * Usage in Model:
 *   use HasFiltering;
 *
 *   protected array $filterable = ['status', 'category', 'created_at'];
 *   protected array $sortable = ['name', 'created_at', 'price'];
 *   protected array $searchable = ['name', 'description', 'email'];
 *   protected array $filterAliases = ['type' => 'category_type'];
 *   protected array $dateFilters = ['created_at', 'event_date', 'updated_at'];
 */
trait HasFiltering
{
    /**
     * Apply filters from request to the query.
     */
    public function scopeApplyFilters(Builder $query, Request $request): Builder
    {
        $this->applyWhereFilters($query, $request);
        $this->applyDateRangeFilters($query, $request);
        $this->applySearch($query, $request);
        $this->applySorting($query, $request);

        return $query;
    }

    /**
     * Apply where clause filters.
     */
    protected function applyWhereFilters(Builder $query, Request $request): void
    {
        $filterable = $this->getFilterableFields();
        $aliases = $this->getFilterAliases();

        foreach ($filterable as $field) {
            $requestField = array_search($field, $aliases) ?: $field;
            $value = $request->query($requestField) ?? $request->query("filter.$requestField");

            if ($value !== null && $value !== '') {
                $this->applyFilter($query, $field, $value);
            }
        }
    }

    /**
     * Apply a single filter.
     */
    protected function applyFilter(Builder $query, string $field, mixed $value): void
    {
        // Handle array values (IN clause)
        if (is_array($value)) {
            $query->whereIn($field, $value);
            return;
        }

        // Handle comma-separated values as IN clause
        if (is_string($value) && str_contains($value, ',')) {
            $values = array_map('trim', explode(',', $value));
            $query->whereIn($field, $values);
            return;
        }

        // Handle operators in value (e.g., ">=100", "!=pending")
        if (is_string($value)) {
            $operatorPatterns = [
                '/^>=(.+)$/' => '>=',
                '/^<=(.+)$/' => '<=',
                '/^!=(.+)$/' => '!=',
                '/^>(.+)$/' => '>',
                '/^<(.+)$/' => '<',
                '/^~(.+)$/' => 'LIKE', // Partial match
            ];

            foreach ($operatorPatterns as $pattern => $operator) {
                if (preg_match($pattern, $value, $matches)) {
                    $actualValue = $matches[1];
                    
                    if ($operator === 'LIKE') {
                        $query->where($field, 'LIKE', "%{$actualValue}%");
                    } else {
                        $query->where($field, $operator, $actualValue);
                    }
                    return;
                }
            }

            // Handle null check
            if (strtolower($value) === 'null') {
                $query->whereNull($field);
                return;
            }

            if (strtolower($value) === '!null' || strtolower($value) === 'notnull') {
                $query->whereNotNull($field);
                return;
            }
        }

        // Default: exact match
        $query->where($field, $value);
    }

    /**
     * Apply date range filters.
     */
    protected function applyDateRangeFilters(Builder $query, Request $request): void
    {
        $dateFilters = $this->getDateFilterFields();

        foreach ($dateFilters as $field) {
            // Handle explicit date range parameters
            $from = $request->query("{$field}_from") ?? $request->query("filter.{$field}_from");
            $to = $request->query("{$field}_to") ?? $request->query("filter.{$field}_to");

            if ($from) {
                $query->where($field, '>=', $from);
            }

            if ($to) {
                $query->where($field, '<=', $to);
            }

            // Handle between syntax: "2024-01-01..2024-12-31"
            $between = $request->query($field) ?? $request->query("filter.$field");
            if ($between && is_string($between) && str_contains($between, '..')) {
                [$start, $end] = explode('..', $between, 2);
                if ($start && $end) {
                    $query->whereBetween($field, [trim($start), trim($end)]);
                }
            }
        }
    }

    /**
     * Apply search across searchable fields.
     */
    protected function applySearch(Builder $query, Request $request): void
    {
        $searchTerm = $request->query('search') ?? $request->query('q');

        if (empty($searchTerm)) {
            return;
        }

        $searchable = $this->getSearchableFields();

        if (empty($searchable)) {
            return;
        }

        $query->where(function (Builder $q) use ($searchTerm, $searchable) {
            foreach ($searchable as $field) {
                // Handle nested relationships (e.g., 'client.name')
                if (str_contains($field, '.')) {
                    [$relation, $column] = explode('.', $field, 2);
                    $q->orWhereHas($relation, function (Builder $subQ) use ($column, $searchTerm) {
                        $subQ->where($column, 'LIKE', "%{$searchTerm}%");
                    });
                } else {
                    $q->orWhere($field, 'LIKE', "%{$searchTerm}%");
                }
            }
        });
    }

    /**
     * Apply sorting to the query.
     */
    protected function applySorting(Builder $query, Request $request): void
    {
        $sortParam = $request->query('sort') ?? $request->query('order_by');
        
        if (empty($sortParam)) {
            // Apply default sorting if defined
            if (method_exists($this, 'getDefaultSort')) {
                $defaultSort = $this->getDefaultSort();
                if ($defaultSort) {
                    $query->orderBy($defaultSort['field'], $defaultSort['direction'] ?? 'asc');
                }
            }
            return;
        }

        $sortable = $this->getSortableFields();

        // Handle multiple sort fields: "name,-created_at"
        $sorts = is_string($sortParam) ? explode(',', $sortParam) : (array) $sortParam;

        foreach ($sorts as $sort) {
            $sort = trim($sort);
            $direction = 'asc';

            // Handle descending with "-" prefix
            if (str_starts_with($sort, '-')) {
                $direction = 'desc';
                $sort = substr($sort, 1);
            }

            // Handle explicit direction suffix: "name:desc"
            if (str_contains($sort, ':')) {
                [$sort, $dir] = explode(':', $sort, 2);
                $direction = strtolower($dir) === 'desc' ? 'desc' : 'asc';
            }

            // Only sort by allowed fields
            if (in_array($sort, $sortable, true)) {
                $query->orderBy($sort, $direction);
            }
        }
    }

    /**
     * Get filterable fields for this model.
     */
    protected function getFilterableFields(): array
    {
        return $this->filterable ?? [];
    }

    /**
     * Get sortable fields for this model.
     */
    protected function getSortableFields(): array
    {
        return $this->sortable ?? [];
    }

    /**
     * Get searchable fields for this model.
     */
    protected function getSearchableFields(): array
    {
        return $this->searchable ?? [];
    }

    /**
     * Get filter field aliases.
     */
    protected function getFilterAliases(): array
    {
        return $this->filterAliases ?? [];
    }

    /**
     * Get date filter fields.
     */
    protected function getDateFilterFields(): array
    {
        return $this->dateFilters ?? ['created_at', 'updated_at'];
    }

    /**
     * Scope to only apply filters without sorting.
     */
    public function scopeFilter(Builder $query, Request $request): Builder
    {
        $this->applyWhereFilters($query, $request);
        $this->applyDateRangeFilters($query, $request);
        $this->applySearch($query, $request);

        return $query;
    }

    /**
     * Scope to only apply sorting.
     */
    public function scopeSort(Builder $query, Request $request): Builder
    {
        $this->applySorting($query, $request);

        return $query;
    }

    /**
     * Scope to only apply search.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        $request = new Request(['search' => $term]);
        $this->applySearch($query, $request);

        return $query;
    }
}
