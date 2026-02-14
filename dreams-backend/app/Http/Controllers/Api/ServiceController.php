<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->input('category', 'All');

        $cacheKey = 'services_public_' . $category;

        $services = Cache::remember($cacheKey, now()->addHours(12), function () use ($category) {
            $query = Service::query()
                ->where('is_active', true)
                ->orderBy('sort_order');

            if ($category !== 'All') {
                $query->where('category', $category);
            }

            return $query->get();
        });

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    public function adminIndex(Request $request)
    {
        $services = Cache::remember('services_admin_all', now()->addHours(12), function () {
            return Service::orderBy('sort_order')->get();
        });

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        $images = [];
        if ($request->hasFile('images')) {
            $imageService = app(ImageService::class);
            foreach ($request->file('images') as $image) {
                $path = $imageService->processAndStore($image, 'services');
                $images[] = $path;
            }
        }

        if ($request->filled('image_urls')) {
            $urls = is_array($request->input('image_urls'))
                ? $request->input('image_urls')
                : json_decode($request->input('image_urls'), true);
            $images = array_merge($images, $urls);
        }

        $validated['images'] = $images;
        $service = Service::create($validated);

        // Clear services cache
        $this->clearServicesCache();

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'data' => $service
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $this->validateData($request, false);

        $currentImages = $service->images ?? [];

        if ($request->hasFile('images')) {
            $imageService = app(ImageService::class);
            foreach ($request->file('images') as $image) {
                $path = $imageService->processAndStore($image, 'services');
                $currentImages[] = $path;
            }
        }

        if ($request->has('images_to_remove')) {
            $toRemove = is_array($request->input('images_to_remove'))
                ? $request->input('images_to_remove')
                : json_decode($request->input('images_to_remove'), true);

            foreach ($toRemove as $path) {
                if (($key = array_search($path, $currentImages)) !== false) {
                    if (!Str::startsWith($path, ['http://', 'https://'])) {
                        app(ImageService::class)->deleteImage($path);
                    }
                    unset($currentImages[$key]);
                }
            }
            $currentImages = array_values($currentImages);
        }

        $validated['images'] = $currentImages;
        $service->update($validated);

        // Clear services cache
        $this->clearServicesCache();

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $service
        ]);
    }

    public function destroy(Service $service)
    {
        if ($service->images) {
            foreach ($service->images as $path) {
                if (!Str::startsWith($path, ['http://', 'https://'])) {
                    app(ImageService::class)->deleteImage($path);
                }
            }
        }

        $service->delete();

        // Clear services cache
        $this->clearServicesCache();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully'
        ]);
    }

    protected function clearServicesCache()
    {
        Cache::forget('services_admin_all');
        // Since we have category-based cache keys, we might want to clear all variants
        // If the number of categories is small, we could manually clear them, 
        // but it's better to use a tag if the cache driver supports it (e.g. redis/memcached)
        // For development/simple systems, manually clearing known keys or using a common prefix is common.
        // As a simpler solution for now, we'll clear the main admin cache which usually triggers 
        // an admin re-fetch that could then possibly clear public caches if we used tags.
        // For standard file cache, we can't easily clear by prefix without custom logic.

        // Let's just clear the main ones for now.
        Cache::forget('services_public_All');
        // Note: Specific category caches will expire in 12 hours or can be cleared if tracked.
    }

    protected function validateData(Request $request, bool $isCreate = true): array
    {
        $rules = [
            'title' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'category' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'details' => ['nullable', 'string'],
            'rating' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'icon' => ['sometimes', 'string'],
            'link' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ];

        return $request->validate($rules);
    }
}
