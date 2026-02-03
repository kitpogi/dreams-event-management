<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Http\Requests\Venue\StoreVenueRequest;
use App\Http\Requests\Venue\UpdateVenueRequest;
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

    public function store(StoreVenueRequest $request)
    {
        $venue = Venue::create($request->validated());

        // Clear venues cache
        Cache::forget('venues_all');

        return $this->successResponse($venue, 'Venue created successfully', 201);
    }

    public function update(UpdateVenueRequest $request, $id)
    {
        $venue = Venue::find($id);

        if (!$venue) {
            return $this->notFoundResponse('Venue not found');
        }

        $venue->update($request->validated());

        // Clear venues cache
        Cache::forget('venues_all');

        return $this->successResponse($venue, 'Venue updated successfully');
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
