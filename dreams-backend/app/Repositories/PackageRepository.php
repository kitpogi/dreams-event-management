<?php

namespace App\Repositories;

use App\Models\EventPackage;
use Illuminate\Pagination\LengthAwarePaginator;

class PackageRepository extends BaseRepository
{
    public function __construct(EventPackage $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get packages by category
     */
    public function getByCategory(string $category)
    {
        return $this->model
            ->with($this->relations)
            ->where('package_category', $category)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get packages by price range
     */
    public function getByPriceRange(int $minPrice, int $maxPrice)
    {
        return $this->model
            ->with($this->relations)
            ->whereBetween('package_price', [$minPrice, $maxPrice])
            ->orderBy('package_price', 'asc')
            ->get();
    }

    /**
     * Get packages with capacity for guests
     */
    public function getWithCapacity(int $guests)
    {
        return $this->model
            ->with($this->relations)
            ->where('capacity', '>=', $guests)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get featured packages
     */
    public function getFeatured(int $limit = 10)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_featured', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Search packages with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('package_name', 'LIKE', "%{$query}%")
            ->orWhere('package_description', 'LIKE', "%{$query}%")
            ->orWhere('package_category', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get active packages
     */
    public function getActive()
    {
        return $this->model
            ->with($this->relations)
            ->where('is_active', true)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }
}
