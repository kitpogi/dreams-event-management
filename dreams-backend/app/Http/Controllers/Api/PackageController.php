<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventPackage;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $query = EventPackage::with(['venue', 'images']);

        if ($request->has('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('minPrice')) {
            $query->where('price', '>=', $request->minPrice);
        }

        if ($request->has('maxPrice')) {
            $query->where('price', '<=', $request->maxPrice);
        }

        $packages = $query->get();

        return response()->json(['data' => $packages]);
    }

    public function show($id)
    {
        $package = EventPackage::with(['venue', 'images', 'reviews.user'])
            ->findOrFail($id);

        return response()->json(['data' => $package]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'venue_id' => 'required|exists:venues,id',
            'type' => 'nullable|string',
            'theme' => 'nullable|string',
            'is_featured' => 'boolean',
        ]);

        $package = EventPackage::create($request->all());

        return response()->json(['data' => $package], 201);
    }

    public function update(Request $request, $id)
    {
        $package = EventPackage::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'capacity' => 'sometimes|integer|min:1',
            'venue_id' => 'sometimes|exists:venues,id',
            'type' => 'nullable|string',
            'theme' => 'nullable|string',
            'is_featured' => 'boolean',
        ]);

        $package->update($request->all());

        return response()->json(['data' => $package]);
    }

    public function destroy($id)
    {
        $package = EventPackage::findOrFail($id);
        $package->delete();

        return response()->json(['message' => 'Package deleted successfully']);
    }
}

