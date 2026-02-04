<?php

namespace App\Repositories\Contracts;

use App\Models\EventPackage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Package Repository Interface
 * 
 * Defines the contract for package-specific repository operations.
 */
interface PackageRepositoryInterface extends RepositoryInterface
{
    /**
     * Get packages by category/type.
     *
     * @param string $category
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByCategory(string $category, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get packages within a price range.
     *
     * @param float $minPrice
     * @param float $maxPrice
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByPriceRange(float $minPrice, float $maxPrice, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get active/available packages.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getActive(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get featured packages.
     *
     * @param int $limit
     * @return Collection
     */
    public function getFeatured(int $limit = 6): Collection;

    /**
     * Get popular packages based on booking count.
     *
     * @param int $limit
     * @return Collection
     */
    public function getPopular(int $limit = 6): Collection;

    /**
     * Search packages by name or description.
     *
     * @param string $query
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function search(string $query, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get packages with their average ratings.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getWithRatings(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get packages by capacity.
     *
     * @param int $minCapacity
     * @param int|null $maxCapacity
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByCapacity(int $minCapacity, ?int $maxCapacity = null, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get related packages.
     *
     * @param EventPackage $package
     * @param int $limit
     * @return Collection
     */
    public function getRelated(EventPackage $package, int $limit = 4): Collection;

    /**
     * Update package availability.
     *
     * @param int $packageId
     * @param bool $isActive
     * @return EventPackage
     */
    public function updateAvailability(int $packageId, bool $isActive): EventPackage;

    /**
     * Get package statistics.
     *
     * @return array
     */
    public function getStatistics(): array;

    /**
     * Get all categories.
     *
     * @return Collection
     */
    public function getCategories(): Collection;
}
