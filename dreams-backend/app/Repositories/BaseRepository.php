<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Closure;

abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;
    protected array $relations = [];
    protected string $orderBy = 'id';
    protected string $orderDirection = 'asc';
    protected array $scopes = [];
    protected array $criteria = [];

    /**
     * Create a new repository instance
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Get all records
     */
    public function all(): Collection
    {
        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get paginated records
     */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Find record by ID
     */
    public function find(int $id): ?Model
    {
        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->find($id);
    }

    /**
     * Create a new record
     */
    public function create(array $attributes): Model
    {
        return $this->model->create($attributes);
    }

    /**
     * Update a record
     */
    public function update(int $id, array $attributes): bool
    {
        $model = $this->find($id);
        if (!$model) {
            return false;
        }
        return $model->update($attributes);
    }

    /**
     * Delete a record
     */
    public function delete(int $id): bool
    {
        $model = $this->find($id);
        if (!$model) {
            return false;
        }
        return (bool) $model->delete();
    }

    /**
     * Find by where condition
     */
    public function where(string $column, $operator = null, $value = null): Collection
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->where($column, $operator, $value)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Find first record matching where condition
     */
    public function firstWhere(string $column, $operator = null, $value = null): ?Model
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->where($column, $operator, $value)
            ->first();
    }

    /**
     * Set eager loading relations
     */
    public function with(array $relations): self
    {
        $this->relations = $relations;
        return $this;
    }

    /**
     * Add where in clause
     */
    public function whereIn(string $column, array $values): Collection
    {
        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->whereIn($column, $values)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Order query results
     */
    public function orderBy(string $column, string $direction = 'asc'): self
    {
        $this->orderBy = $column;
        $this->orderDirection = $direction;
        return $this;
    }

    /**
     * Get count of records
     */
    public function count(): int
    {
        return $this->applyScopes($this->model->query())->count();
    }

    /**
     * Check if record exists
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    // ========================================
    // Query Scope Methods
    // ========================================

    /**
     * Add a scope to the query.
     *
     * @param string $name Scope name
     * @param Closure $scope Scope closure that receives Builder
     * @return self
     */
    public function addScope(string $name, Closure $scope): self
    {
        $this->scopes[$name] = $scope;
        return $this;
    }

    /**
     * Remove a scope from the query.
     *
     * @param string $name Scope name
     * @return self
     */
    public function removeScope(string $name): self
    {
        unset($this->scopes[$name]);
        return $this;
    }

    /**
     * Clear all scopes.
     *
     * @return self
     */
    public function clearScopes(): self
    {
        $this->scopes = [];
        return $this;
    }

    /**
     * Apply scopes to a query builder.
     *
     * @param Builder $query
     * @return Builder
     */
    protected function applyScopes(Builder $query): Builder
    {
        foreach ($this->scopes as $scope) {
            $query = $scope($query);
        }

        foreach ($this->criteria as $criterion) {
            $query = $criterion($query);
        }

        return $query;
    }

    /**
     * Scope: Filter by active status.
     *
     * @return self
     */
    public function active(): self
    {
        return $this->addScope('active', function (Builder $query) {
            return $query->where('is_active', true);
        });
    }

    /**
     * Scope: Filter records created within a date range.
     *
     * @param string $startDate
     * @param string $endDate
     * @return self
     */
    public function createdBetween(string $startDate, string $endDate): self
    {
        return $this->addScope('createdBetween', function (Builder $query) use ($startDate, $endDate) {
            return $query->whereBetween('created_at', [$startDate, $endDate]);
        });
    }

    /**
     * Scope: Filter records updated recently.
     *
     * @param int $days
     * @return self
     */
    public function recentlyUpdated(int $days = 7): self
    {
        return $this->addScope('recentlyUpdated', function (Builder $query) use ($days) {
            return $query->where('updated_at', '>=', now()->subDays($days));
        });
    }

    /**
     * Scope: Filter records created today.
     *
     * @return self
     */
    public function today(): self
    {
        return $this->addScope('today', function (Builder $query) {
            return $query->whereDate('created_at', today());
        });
    }

    /**
     * Scope: Filter records created this week.
     *
     * @return self
     */
    public function thisWeek(): self
    {
        return $this->addScope('thisWeek', function (Builder $query) {
            return $query->whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]);
        });
    }

    /**
     * Scope: Filter records created this month.
     *
     * @return self
     */
    public function thisMonth(): self
    {
        return $this->addScope('thisMonth', function (Builder $query) {
            return $query->whereMonth('created_at', now()->month)
                         ->whereYear('created_at', now()->year);
        });
    }

    /**
     * Scope: Search across multiple columns.
     *
     * @param string $searchTerm
     * @param array $columns
     * @return self
     */
    public function search(string $searchTerm, array $columns): self
    {
        return $this->addScope('search', function (Builder $query) use ($searchTerm, $columns) {
            return $query->where(function (Builder $q) use ($searchTerm, $columns) {
                foreach ($columns as $index => $column) {
                    $method = $index === 0 ? 'where' : 'orWhere';
                    $q->$method($column, 'LIKE', "%{$searchTerm}%");
                }
            });
        });
    }

    /**
     * Scope: Limit results.
     *
     * @param int $limit
     * @return self
     */
    public function limit(int $limit): self
    {
        return $this->addScope('limit', function (Builder $query) use ($limit) {
            return $query->limit($limit);
        });
    }

    /**
     * Scope: Filter by null column.
     *
     * @param string $column
     * @return self
     */
    public function whereNull(string $column): self
    {
        return $this->addScope("whereNull_{$column}", function (Builder $query) use ($column) {
            return $query->whereNull($column);
        });
    }

    /**
     * Scope: Filter by not null column.
     *
     * @param string $column
     * @return self
     */
    public function whereNotNull(string $column): self
    {
        return $this->addScope("whereNotNull_{$column}", function (Builder $query) use ($column) {
            return $query->whereNotNull($column);
        });
    }

    // ========================================
    // Criteria Methods (chainable filters)
    // ========================================

    /**
     * Add a criterion to the query.
     *
     * @param Closure $criterion
     * @return self
     */
    public function pushCriteria(Closure $criterion): self
    {
        $this->criteria[] = $criterion;
        return $this;
    }

    /**
     * Clear all criteria.
     *
     * @return self
     */
    public function clearCriteria(): self
    {
        $this->criteria = [];
        return $this;
    }

    /**
     * Reset all query modifications.
     *
     * @return self
     */
    public function reset(): self
    {
        $this->relations = [];
        $this->orderBy = 'id';
        $this->orderDirection = 'asc';
        $this->scopes = [];
        $this->criteria = [];
        return $this;
    }

    /**
     * Get the underlying model.
     *
     * @return Model
     */
    public function getModel(): Model
    {
        return $this->model;
    }

    /**
     * Get a new query builder instance.
     *
     * @return Builder
     */
    public function newQuery(): Builder
    {
        return $this->applyScopes($this->model->query())
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection);
    }
}
