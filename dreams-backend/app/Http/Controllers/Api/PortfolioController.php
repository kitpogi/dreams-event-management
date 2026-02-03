<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Services\ImageService;
use App\Http\Requests\Portfolio\StorePortfolioRequest;
use App\Http\Requests\Portfolio\UpdatePortfolioRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    public function index(Request $request)
    {
        // Build cache key based on request parameters
        $cacheKey = 'portfolio_' . md5(json_encode([
            'search' => $request->input('search'),
            'category' => $request->input('category'),
            'featured' => $request->boolean('featured'),
            'limit' => $request->input('limit'),
        ]));

        // Cache for 1 hour (portfolio items don't change often)
        // Only cache if no search/filter (to avoid cache bloat)
        $shouldCache = !$request->filled('search') && !$request->filled('category');

        if ($shouldCache && Cache::has($cacheKey)) {
            return response()->json([
                'data' => Cache::get($cacheKey),
            ]);
        }

        $query = PortfolioItem::query()
            ->orderBy('display_order')
            ->orderByDesc('event_date')
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('category', 'like', '%' . $search . '%');
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($limit = $request->input('limit')) {
            $query->limit((int) $limit);
        }

        $items = $query->get();

        // Cache the result if applicable
        if ($shouldCache) {
            Cache::put($cacheKey, $items, now()->addHour());
        }

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(StorePortfolioRequest $request)
    {
        $validated = $request->validated();
        $validated['image_path'] = $this->resolveImagePath($request);

        $item = PortfolioItem::create($validated);

        // Clear portfolio cache
        Cache::flush(); // Clear all cache

        return $this->successResponse($item, 'Portfolio item created successfully', 201);
    }

    public function update(Request $request, PortfolioItem $portfolioItem)
    {
        $data = $this->validateData($request, false);

        if ($request->hasFile('image') || $request->filled('image_url')) {
            $data['image_path'] = $this->resolveImagePath($request, $portfolioItem);
        }

        $portfolioItem->update($data);

        // Clear portfolio cache
        Cache::flush(); // Clear all cache

        return response()->json(['data' => $portfolioItem]);
    }

    public function destroy(PortfolioItem $portfolioItem)
    {
        if ($portfolioItem->image_path && !Str::startsWith($portfolioItem->image_path, ['http://', 'https://'])) {
            app(ImageService::class)->deleteImage($portfolioItem->image_path);
        }

        $portfolioItem->delete();

        // Clear portfolio cache
        Cache::flush(); // Clear all cache

        return response()->json(['message' => 'Portfolio item deleted successfully']);
    }

    protected function validateData(Request $request, bool $isCreate = true): array
    {
        $rules = [
            'title' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'is_featured' => ['sometimes', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'image_url' => ['nullable', 'url'],
            'image' => ['nullable', 'image', 'max:5120'],
        ];

        return $request->validate($rules);
    }

    protected function resolveImagePath(Request $request, ?PortfolioItem $existing = null): ?string
    {
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($existing && $existing->image_path && !Str::startsWith($existing->image_path, ['http://', 'https://'])) {
                app(ImageService::class)->deleteImage($existing->image_path);
            }

            $imageService = app(ImageService::class);
            return $imageService->processAndStore(
                $request->file('image'),
                'portfolio',
                1920, // max width
                1080, // max height
                85    // quality
            );
        }

        if ($request->filled('image_url')) {
            return $request->input('image_url');
        }

        return $existing?->image_path;
    }
}


