<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\LogsAudit;
use App\Models\EventPackage;
use App\Services\ImageService;
use App\Http\Resources\PackageResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * @OA\Get(
 *     path="/api/packages",
 *     summary="Get all packages",
 *     tags={"Packages"},
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         description="Page number",
 *         required=false,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         description="Items per page (1-100)",
 *         required=false,
 *         @OA\Schema(type="integer", example=12)
 *     ),
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         description="Search by package name",
 *         required=false,
 *         @OA\Schema(type="string")
 *     ),
 *     @OA\Parameter(
 *         name="minPrice",
 *         in="query",
 *         description="Minimum price",
 *         required=false,
 *         @OA\Schema(type="number")
 *     ),
 *     @OA\Parameter(
 *         name="maxPrice",
 *         in="query",
 *         description="Maximum price",
 *         required=false,
 *         @OA\Schema(type="number")
 *     ),
 *     @OA\Parameter(
 *         name="category",
 *         in="query",
 *         description="Package category",
 *         required=false,
 *         @OA\Schema(type="string")
 *     ),
 *     @OA\Parameter(
 *         name="minCapacity",
 *         in="query",
 *         description="Minimum capacity",
 *         required=false,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Parameter(
 *         name="sort",
 *         in="query",
 *         description="Sort order (newest, oldest, price_asc, price_desc)",
 *         required=false,
 *         @OA\Schema(type="string", example="newest")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="List of packages",
 *         @OA\JsonContent(
 *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
 *             @OA\Property(property="meta", type="object",
 *                 @OA\Property(property="current_page", type="integer"),
 *                 @OA\Property(property="per_page", type="integer"),
 *                 @OA\Property(property="total", type="integer"),
 *                 @OA\Property(property="last_page", type="integer")
 *             )
 *         )
 *     )
 * )
 */
class PackageController extends Controller
{
    use LogsAudit;
    public function index(Request $request)
    {
        try {
            // Pagination controls
            $perPage = (int) $request->query('per_page', 12);
            $perPage = max(1, min($perPage, 100)); // clamp between 1 and 100
            $page = (int) $request->query('page', 1);
            $page = max(1, $page);

            // Build cache key based on request parameters
            $cacheKey = 'packages_' . md5(json_encode([
                'per_page' => $perPage,
                'page' => $page,
                'search' => $request->query('search'),
                'minPrice' => $request->query('minPrice'),
                'maxPrice' => $request->query('maxPrice'),
                'category' => $request->query('category'),
                'minCapacity' => $request->query('minCapacity'),
                'sort' => $request->query('sort', 'newest'),
            ]));

            // Cache for 15 minutes (900 seconds)
            // Only cache if no search/filter parameters (to avoid cache bloat)
            $shouldCache = !$request->filled('search') &&
                !$request->filled('minPrice') &&
                !$request->filled('maxPrice') &&
                !$request->filled('category') &&
                !$request->filled('minCapacity');

            if ($shouldCache && Cache::has($cacheKey)) {
                return response()->json(Cache::get($cacheKey));
            }

            // Only eager load venue, images table doesn't exist - packages use package_image field directly
            $query = EventPackage::with('venue');

            // By default, only show active packages (customers should not see inactive ones)
            // Admins can pass include_inactive=true to see all packages
            if (!$request->boolean('include_inactive')) {
                $query->where('is_active', true);
            }

            if ($request->filled('search')) {
                $query->where('package_name', 'like', '%' . $request->search . '%');
            }

            if ($request->filled('minPrice')) {
                $query->where('package_price', '>=', $request->minPrice);
            }

            if ($request->filled('maxPrice')) {
                $query->where('package_price', '<=', $request->maxPrice);
            }

            if ($request->filled('category')) {
                $query->where('package_category', $request->category);
            }

            if ($request->filled('minCapacity')) {
                $query->where('capacity', '>=', $request->minCapacity);
            }

            // Sorting
            $sort = $request->query('sort', 'newest');
            switch ($sort) {
                case 'price_asc':
                    $query->orderBy('package_price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('package_price', 'desc');
                    break;
                case 'oldest':
                    $query->orderBy('created_at', 'asc');
                    break;
                default:
                    $query->orderBy('created_at', 'desc');
            }

            $paginated = $query
                ->paginate($perPage, ['*'], 'page', $page);

            $response = [
                'data' => PackageResource::collection($paginated->items()),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'last_page' => $paginated->lastPage(),
                ],
            ];

            // Cache the response if applicable
            if ($shouldCache) {
                Cache::put($cacheKey, $response, now()->addMinutes(15));
            }

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error fetching packages: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch packages',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/packages/featured",
     *     summary="Get featured packages for homepage",
     *     tags={"Packages"},
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         description="Maximum number of packages to return (default: 8)",
     *         required=false,
     *         @OA\Schema(type="integer", example=8)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of featured packages",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(type="object"))
     *         )
     *     )
     * )
     */
    public function featured(Request $request)
    {
        try {
            $limit = (int) $request->query('limit', 8);
            $limit = max(1, min($limit, 20)); // clamp between 1 and 20

            $cacheKey = "packages_featured_{$limit}";

            // Cache for 15 minutes
            $packages = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($limit) {
                return EventPackage::with('venue')
                    ->where('is_featured', true)
                    ->where('is_active', true)
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get();
            });

            return response()->json([
                'data' => PackageResource::collection($packages),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching featured packages: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch featured packages',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/packages/{id}",
     *     summary="Get package by ID",
     *     tags={"Packages"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Package details",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="package_id", type="integer"),
     *                 @OA\Property(property="package_name", type="string"),
     *                 @OA\Property(property="package_description", type="string"),
     *                 @OA\Property(property="package_price", type="number"),
     *                 @OA\Property(property="average_rating", type="number", nullable=true),
     *                 @OA\Property(property="total_reviews", type="integer")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Package not found")
     * )
     */
    public function show($id)
    {
        $cacheKey = "package_{$id}_details";

        // Cache for 30 minutes
        $packageData = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($id) {
            // Load package with venue and reviews
            $package = EventPackage::with(['venue', 'reviews.client'])
                ->findOrFail($id);

            // Calculate average rating and total reviews
            $reviews = $package->reviews;
            $averageRating = $reviews->avg('rating');
            $totalReviews = $reviews->count();

            // Use PackageResource for consistent formatting
            $data = (new PackageResource($package))->toArray(request());
            $data['average_rating'] = $averageRating ? round((float) $averageRating, 1) : null;
            $data['total_reviews'] = $totalReviews;

            return $data;
        });

        return response()->json(['data' => $packageData]);
    }

    /**
     * @OA\Post(
     *     path="/api/packages",
     *     summary="Create a new package (Admin only)",
     *     tags={"Packages"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"package_name", "package_description", "package_category", "package_price"},
     *                 @OA\Property(property="package_name", type="string", example="Wedding Package"),
     *                 @OA\Property(property="package_description", type="string", example="Complete wedding package"),
     *                 @OA\Property(property="package_category", type="string", example="Wedding"),
     *                 @OA\Property(property="package_price", type="number", example=5000.00),
     *                 @OA\Property(property="capacity", type="integer", example=100),
     *                 @OA\Property(property="venue_id", type="integer", nullable=true),
     *                 @OA\Property(property="package_image", type="string", format="binary", description="Package image file")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Package created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Forbidden - Admin only"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(\App\Http\Requests\Package\StorePackageRequest $request)
    {
        // Validation handled by FormRequest

        $data = $request->only([
            'package_name',
            'package_description',
            'package_category',
            'package_price',
            'capacity',
            'venue_id',
            'package_inclusions',
            'is_featured',
            'is_active',
        ]);

        if ($request->hasFile('package_image')) {
            $imageService = app(ImageService::class);
            $path = $imageService->processAndStore(
                $request->file('package_image'),
                'packages',
                1920, // max width
                1080, // max height
                85    // quality
            );
            // Store the full URL to maintain compatibility with frontend which expects a URL
            $data['package_image'] = asset('storage/' . $path);
        }

        $package = EventPackage::create($data);

        // Clear packages cache
        Cache::flush(); // Clear all cache, or use tags if available

        // Log the creation
        $this->logAudit(
            'package.created',
            $package,
            null,
            $package->toArray(),
            "Created package: {$package->package_name}"
        );

        return response()->json(['data' => $package], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/packages/{id}",
     *     summary="Update a package (Admin only)",
     *     tags={"Packages"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="package_name", type="string"),
     *                 @OA\Property(property="package_description", type="string"),
     *                 @OA\Property(property="package_category", type="string"),
     *                 @OA\Property(property="package_price", type="number"),
     *                 @OA\Property(property="capacity", type="integer"),
     *                 @OA\Property(property="venue_id", type="integer", nullable=true),
     *                 @OA\Property(property="package_image", type="string", format="binary"),
     *                 @OA\Property(property="package_inclusions", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Package updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Forbidden - Admin only"),
     *     @OA\Response(response=404, description="Package not found")
     * )
     */
    public function update(\App\Http\Requests\Package\UpdatePackageRequest $request, $id)
    {
        $package = EventPackage::findOrFail($id);

        // Validation handled by FormRequest

        // Store old values for audit log
        $oldValues = $package->only([
            'package_name',
            'package_description',
            'package_category',
            'package_price',
            'capacity',
            'venue_id',
            'package_inclusions',
        ]);

        $data = $request->only([
            'package_name',
            'package_description',
            'package_category',
            'package_price',
            'capacity',
            'venue_id',
            'package_inclusions',
            'is_featured',
            'is_active',
        ]);

        if ($request->hasFile('package_image')) {
            // Delete old image if exists
            if ($package->package_image) {
                $oldPath = str_replace(asset('storage/'), '', $package->package_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    app(ImageService::class)->deleteImage($oldPath);
                }
            }

            $imageService = app(ImageService::class);
            $path = $imageService->processAndStore(
                $request->file('package_image'),
                'packages',
                1920, // max width
                1080, // max height
                85    // quality
            );
            $data['package_image'] = asset('storage/' . $path);
        }

        $package->update($data);

        // Clear cache for this package and packages list
        Cache::forget("package_{$package->package_id}_details");
        Cache::flush(); // Clear all packages cache

        // Log the update
        $this->logAudit(
            'package.updated',
            $package,
            $oldValues,
            $package->fresh()->only(array_keys($oldValues)),
            "Updated package: {$package->package_name}"
        );

        return response()->json(['data' => $package]);
    }

    /**
     * @OA\Delete(
     *     path="/api/packages/{id}",
     *     summary="Delete a package (Admin only)",
     *     tags={"Packages"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Package deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Package deleted successfully")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Forbidden - Admin only"),
     *     @OA\Response(response=404, description="Package not found")
     * )
     */
    public function destroy($id)
    {
        $package = EventPackage::findOrFail($id);
        $packageName = $package->package_name;
        $packageData = $package->toArray();

        // Delete associated image
        if ($package->package_image) {
            $imagePath = str_replace(asset('storage/'), '', $package->package_image);
            if (Storage::disk('public')->exists($imagePath)) {
                app(ImageService::class)->deleteImage($imagePath);
            }
        }

        $packageId = $package->package_id;
        $package->delete();

        // Clear cache
        Cache::forget("package_{$packageId}_details");
        Cache::flush(); // Clear all packages cache

        // Log the deletion
        $this->logAudit(
            'package.deleted',
            null,
            $packageData,
            null,
            "Deleted package: {$packageName}"
        );

        return response()->json(['message' => 'Package deleted successfully']);
    }
}

