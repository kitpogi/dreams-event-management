<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ClientService;
use App\Models\Review;
use App\Models\BookingDetail;
use App\Models\EventPackage;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Requests\Review\UpdateReviewRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
    public function store(StoreReviewRequest $request)
    {

        $validated = $request->validated();

        // Get authenticated user's client record
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client) {
            return $this->notFoundResponse('Client record not found');
        }

        // Verify the booking belongs to the client
        $booking = BookingDetail::findOrFail($validated['booking_id']);
        if ($booking->client_id !== $client->client_id) {
            return $this->forbiddenResponse('Unauthorized. This booking does not belong to you.');
        }

        // Verify the booking is completed
        if ($booking->booking_status !== 'Completed') {
            return $this->errorResponse('You can only review completed bookings.', 422);
        }

        // Verify the booking is for the specified package
        if ($booking->package_id != $validated['package_id']) {
            return $this->errorResponse('Package ID does not match the booking.', 422);
        }

        // Check if review already exists for this booking
        $existingReview = Review::where('booking_id', $validated['booking_id'])->first();
        if ($existingReview) {
            return $this->errorResponse('You have already reviewed this booking.', 422);
        }

        // Create the review
        $review = Review::create([
            'client_id' => $client->client_id,
            'package_id' => $validated['package_id'],
            'booking_id' => $validated['booking_id'],
            'rating' => $validated['rating'],
            'review_message' => $validated['review_message'] ?? null,
        ]);

        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$validated['package_id']}_reviews");
        Cache::forget("package_{$validated['package_id']}_details");

        $review->load(['client', 'eventPackage']);

        return $this->successResponse($review, 'Review submitted successfully', 201);
    }

    /**
     * Update a review (only by the reviewer)
     */
    public function update(UpdateReviewRequest $request, $id)
    {
        $review = Review::findOrFail($id);

        // Get authenticated user's client record
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client || $review->client_id !== $client->client_id) {
            return $this->forbiddenResponse('Unauthorized. You can only update your own reviews.');
        }

        $validated = $request->validated();
        $packageId = $review->package_id;
        $review->update($validated);
        
        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$packageId}_reviews");
        Cache::forget("package_{$packageId}_details");
        
        $review->load(['client', 'eventPackage']);

        return $this->successResponse($review, 'Review updated successfully');
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
            return $this->forbiddenResponse('Unauthorized. You can only delete your own reviews.');
        }

        $packageId = $review->package_id;
        $review->delete();

        // Clear cache for this package's reviews and package details
        Cache::forget("package_{$packageId}_reviews");
        Cache::forget("package_{$packageId}_details");

        return $this->successResponse(null, 'Review deleted successfully');
    }
}

