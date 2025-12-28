<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ClientService;
use App\Models\Review;
use App\Models\BookingDetail;
use App\Models\EventPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * Get all reviews (public)
     */
    public function index(Request $request)
    {
        $query = Review::with(['client', 'eventPackage']);

        // Filter by package if provided
        if ($request->has('package_id')) {
            $query->where('package_id', $request->package_id);
        }

        // Filter by client if provided (admin only)
        if ($request->has('client_id') && $request->user() && $request->user()->isAdmin()) {
            $query->where('client_id', $request->client_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $reviews]);
    }

    /**
     * Get reviews for a specific package
     */
    public function getPackageReviews($packageId)
    {
        $cacheKey = "package_{$packageId}_reviews";

        // Cache for 30 minutes
        $result = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($packageId) {
            $reviews = Review::with(['client'])
                ->where('package_id', $packageId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Calculate average rating
            $averageRating = $reviews->avg('rating');
            $totalReviews = $reviews->count();

            return [
                'data' => $reviews,
                'average_rating' => round($averageRating, 1),
                'total_reviews' => $totalReviews,
            ];
        });

        return response()->json($result);
    }

    /**
     * Get a specific review
     */
    public function show($id)
    {
        $review = Review::with(['client', 'eventPackage', 'booking'])->findOrFail($id);
        return response()->json(['data' => $review]);
    }

    /**
     * Create a new review (requires authentication)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|exists:event_packages,package_id',
            'booking_id' => 'required|exists:booking_details,booking_id',
            'rating' => 'required|integer|min:1|max:5',
            'review_message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get authenticated user's client record
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client) {
            return response()->json([
                'message' => 'Client record not found'
            ], 404);
        }

        // Verify the booking belongs to the client
        $booking = BookingDetail::findOrFail($request->booking_id);
        if ($booking->client_id !== $client->client_id) {
            return response()->json([
                'message' => 'Unauthorized. This booking does not belong to you.'
            ], 403);
        }

        // Verify the booking is completed
        if ($booking->booking_status !== 'Completed') {
            return response()->json([
                'message' => 'You can only review completed bookings.'
            ], 422);
        }

        // Verify the booking is for the specified package
        if ($booking->package_id != $request->package_id) {
            return response()->json([
                'message' => 'Package ID does not match the booking.'
            ], 422);
        }

        // Check if review already exists for this booking
        $existingReview = Review::where('booking_id', $request->booking_id)->first();
        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this booking.'
            ], 422);
        }

        // Create the review
        $review = Review::create([
            'client_id' => $client->client_id,
            'package_id' => $request->package_id,
            'booking_id' => $request->booking_id,
            'rating' => $request->rating,
            'review_message' => $request->review_message,
        ]);

        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$request->package_id}_reviews");
        Cache::forget("package_{$request->package_id}_details");

        $review->load(['client', 'eventPackage']);

        return response()->json([
            'data' => $review,
            'message' => 'Review submitted successfully'
        ], 201);
    }

    /**
     * Update a review (only by the reviewer)
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // Get authenticated user's client record
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client || $review->client_id !== $client->client_id) {
            return response()->json([
                'message' => 'Unauthorized. You can only update your own reviews.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'sometimes|integer|min:1|max:5',
            'review_message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $packageId = $review->package_id;
        $review->update($request->only(['rating', 'review_message']));
        
        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$packageId}_reviews");
        Cache::forget("package_{$packageId}_details");
        
        $review->load(['client', 'eventPackage']);

        return response()->json([
            'data' => $review,
            'message' => 'Review updated successfully'
        ]);
    }

    /**
     * Delete a review (only by the reviewer or admin)
     */
    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // Get authenticated user's client record
        $client = $this->clientService->getByUserEmail($request->user()->email);
        
        // Allow deletion if user is admin or owns the review
        if (!$request->user()->isAdmin() && (!$client || $review->client_id !== $client->client_id)) {
            return response()->json([
                'message' => 'Unauthorized. You can only delete your own reviews.'
            ], 403);
        }

        $packageId = $review->package_id;
        $review->delete();

        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$packageId}_reviews");
        Cache::forget("package_{$packageId}_details");

        return response()->json([
            'message' => 'Review deleted successfully'
        ]);
    }
}

