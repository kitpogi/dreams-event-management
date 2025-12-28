<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VenueController extends Controller
{
    public function index()
    {
        // Cache venues for 1 hour (3600 seconds) - they don't change often
        $venues = Cache::remember('venues_all', now()->addHour(), function () {
            return Venue::all();
        });

        return response()->json([
            'status' => 'success',
            'data' => $venues
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $venue = Venue::create($validated);

        // Clear venues cache
        Cache::forget('venues_all');

        return response()->json([
            'status' => 'success',
            'message' => 'Venue created successfully',
            'data' => $venue
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $venue = Venue::find($id);

        if (!$venue) {
            return response()->json([
                'status' => 'error',
                'message' => 'Venue not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $venue->update($validated);

        // Clear venues cache
        Cache::forget('venues_all');

        return response()->json([
            'status' => 'success',
            'message' => 'Venue updated successfully',
            'data' => $venue
        ]);
    }

    public function destroy($id)
    {
        $venue = Venue::find($id);

        if (!$venue) {
            return response()->json([
                'status' => 'error',
                'message' => 'Venue not found'
            ], 404);
        }

        // Check if venue is used in any packages
        if ($venue->packages()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete venue because it is used in one or more packages.'
            ], 400);
        }

        $venue->delete();

        // Clear venues cache
        Cache::forget('venues_all');

        return response()->json([
            'status' => 'success',
            'message' => 'Venue deleted successfully'
        ]);
    }
}
