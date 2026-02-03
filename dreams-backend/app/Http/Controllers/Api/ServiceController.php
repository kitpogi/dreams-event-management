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
        $query = Service::query()
            ->where('is_active', true)
            ->orderBy('sort_order');

        if ($category = $request->input('category')) {
            if ($category !== 'All') {
                $query->where('category', $category);
            }
        }

        $services = $query->get();

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    public function adminIndex(Request $request)
    {
        $services = Service::orderBy('sort_order')->get();
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

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully'
        ]);
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
