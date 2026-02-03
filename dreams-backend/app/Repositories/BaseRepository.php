<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\Paginator;

abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;
    protected array $relations = [];
    protected string $orderBy = 'id';
    protected string $orderDirection = 'asc';

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
        return $this->model
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get paginated records
     */
    public function paginate(int $perPage = 15): Paginator
    {
        return $this->model
            ->with($this->relations)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Find record by ID
     */
    public function find(int $id): ?Model
    {
        return $this->model
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

        return $this->model
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

        return $this->model
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
        return $this->model
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
        return $this->model->count();
    }

    /**
     * Check if record exists
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }
}
