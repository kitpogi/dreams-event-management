<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface RepositoryInterface
{
    /**
     * Get all records
     */
    public function all(): Collection;

    /**
     * Get paginated records
     */
    public function paginate(int $perPage = 15);

    /**
     * Find record by ID
     */
    public function find(int $id): ?Model;

    /**
     * Create a new record
     */
    public function create(array $attributes): Model;

    /**
     * Update a record
     */
    public function update(int $id, array $attributes): bool;

    /**
     * Delete a record
     */
    public function delete(int $id): bool;

    /**
     * Find by where condition
     */
    public function where(string $column, $operator = null, $value = null): Collection;

    /**
     * Find first record matching where condition
     */
    public function firstWhere(string $column, $operator = null, $value = null): ?Model;

    /**
     * Set eager loading relations
     */
    public function with(array $relations): self;

    /**
     * Add where clause to query
     */
    public function whereIn(string $column, array $values): Collection;

    /**
     * Order query results
     */
    public function orderBy(string $column, string $direction = 'asc'): self;

    /**
     * Get count of records
     */
    public function count(): int;

    /**
     * Check if record exists
     */
    public function exists(int $id): bool;
}
