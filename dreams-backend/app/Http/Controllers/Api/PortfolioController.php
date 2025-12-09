<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    public function index(Request $request)
    {
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

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['image_path'] = $this->resolveImagePath($request);

        $item = PortfolioItem::create($data);

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, PortfolioItem $portfolioItem)
    {
        $data = $this->validateData($request, false);

        if ($request->hasFile('image') || $request->filled('image_url')) {
            $data['image_path'] = $this->resolveImagePath($request, $portfolioItem);
        }

        $portfolioItem->update($data);

        return response()->json(['data' => $portfolioItem]);
    }

    public function destroy(PortfolioItem $portfolioItem)
    {
        if ($portfolioItem->image_path && !Str::startsWith($portfolioItem->image_path, ['http://', 'https://'])) {
            Storage::disk('public')->delete($portfolioItem->image_path);
        }

        $portfolioItem->delete();

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
            if ($existing && $existing->image_path && !Str::startsWith($existing->image_path, ['http://', 'https://'])) {
                Storage::disk('public')->delete($existing->image_path);
            }

            return $request->file('image')->store('portfolio', 'public');
        }

        if ($request->filled('image_url')) {
            return $request->input('image_url');
        }

        return $existing?->image_path;
    }
}


