<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\LogsAudit;
use App\Services\ClientService;
use App\Repositories\BookingRepository;
use App\Models\EventPackage;
use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\User;
use App\Events\NewBookingCreated;
use App\Events\BookingStatusChanged;
use App\Models\Review;
use App\Http\Resources\BookingResource;
use Carbon\Carbon;
use Illuminate\Support\Facades\Response;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingStatusUpdateMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Get(
 *     path="/api/bookings",
 *     summary="Get all bookings (filtered by user role)",
 *     tags={"Bookings"},
 *     security={{"sanctum": {}}},
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
 *         @OA\Schema(type="integer", example=10)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="List of bookings",
 *         @OA\JsonContent(
 *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
 *             @OA\Property(property="meta", type="object",
 *                 @OA\Property(property="current_page", type="integer"),
 *                 @OA\Property(property="per_page", type="integer"),
 *                 @OA\Property(property="total", type="integer"),
 *                 @OA\Property(property="last_page", type="integer"),
 *                 @OA\Property(property="status_counts", type="object")
 *             )
 *         )
 *     ),
 *     @OA\Response(response=401, description="Unauthenticated")
 * )
 */
class BookingController extends Controller
{
    use LogsAudit;

    protected $clientService;
    protected $bookingRepository;

    public function __construct(ClientService $clientService, BookingRepository $bookingRepository)
    {
        $this->clientService = $clientService;
        $this->bookingRepository = $bookingRepository;
    }

    public function index(Request $request)
    {
        // Pagination controls
        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min($perPage, 100)); // clamp between 1 and 100
        $page = (int) $request->query('page', 1);
        $page = max(1, $page);

        $user = $request->user();

        // Use repository based on user role
        if ($user->isAdmin()) {
            if ($user->isCoordinator()) {
                // Coordinator sees only assigned bookings
                $bookings = $this->bookingRepository->getByCoordinatorId($user->id, $perPage);
                $statusCounts = $this->bookingRepository->getStatusCountsForCoordinator($user->id);
            } else {
                // Full admin sees all bookings
                $bookings = $this->bookingRepository->getAllPaginated($perPage, $page);
                $statusCounts = $this->bookingRepository->getStatusCounts();
            }
        } else {
            // Clients can only see their own bookings
            $client = $this->clientService->getByUserEmail($user->email);
            if ($client) {
                $bookings = $this->bookingRepository->getByClientId($client->client_id, $perPage);
                $statusCounts = $this->bookingRepository->getStatusCountsForClient($client->client_id);
            } else {
                // No client found, return empty result
                return response()->json([
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                        'status_counts' => [],
                    ],
                ]);
            }
        }

        // Use API Resource to format response
        return response()->json([
            'data' => BookingResource::collection($bookings->items()),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
                'last_page' => $bookings->lastPage(),
                'status_counts' => $statusCounts,
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/bookings/{id}",
     *     summary="Get a single booking by ID",
     *     tags={"Bookings"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Booking details",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Booking not found"),
     *     @OA\Response(response=403, description="Unauthorized"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function show(Request $request, $id)
    {
        $booking = $this->bookingRepository->findWithRelations($id);
        
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        // Check authorization
        if ($request->user()->isAdmin()) {
            // Admin can see all bookings
            // If coordinator, only show assigned bookings
            if ($request->user()->isCoordinator() && $booking->coordinator_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            // Clients can only see their own bookings
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if ($client && $booking->client_id !== $client->client_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            } elseif (!$client) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json(['data' => new BookingResource($booking)]);
    }

    /**
     * @OA\Post(
     *     path="/api/bookings",
     *     summary="Create a new booking",
     *     tags={"Bookings"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"package_id", "event_date"},
     *             @OA\Property(property="package_id", type="integer", example=1),
     *             @OA\Property(property="event_date", type="string", format="date", example="2024-12-31"),
     *             @OA\Property(property="event_venue", type="string", example="Grand Ballroom", nullable=true),
     *             @OA\Property(property="event_time", type="string", example="18:00", nullable=true),
     *             @OA\Property(property="guest_count", type="integer", example=100, nullable=true),
     *             @OA\Property(property="number_of_guests", type="integer", example=100, nullable=true),
     *             @OA\Property(property="special_requests", type="string", example="Vegetarian options needed", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Booking created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object"),
     *             @OA\Property(property="message", type="string", example="Booking created successfully")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validation error"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function store(\App\Http\Requests\Booking\StoreBookingRequest $request)
    {
        // Validation handled by FormRequest
        $package = EventPackage::with('venue')->findOrFail($request->package_id);

        // Check if the date is available for this package (with timezone awareness)
        try {
            $eventDate = Carbon::parse($request->event_date, config('app.timezone'))->startOfDay();
        } catch (\Exception $e) {
            return $this->validationErrorResponse(
                ['event_date' => ['Invalid date format. Please use YYYY-MM-DD format.']],
                'Invalid date format'
            );
        }
        $isAvailable = $this->checkDateAvailability($request->package_id, $eventDate);

        if (!$isAvailable) {
            return $this->validationErrorResponse(
                ['event_date' => ['The selected date is already booked.']],
                'This date is not available for booking. Please choose another date.'
            );
        }

        // Map number_of_guests to guest_count if provided
        // Handle both empty string and null
        $guestCount = null;
        if ($request->has('guest_count') && $request->guest_count !== '' && $request->guest_count !== null) {
            $guestCount = (int) $request->guest_count;
        } elseif ($request->has('number_of_guests') && $request->number_of_guests !== '' && $request->number_of_guests !== null) {
            $guestCount = (int) $request->number_of_guests;
        }

        if (!$guestCount || $guestCount < 1) {
            return $this->validationErrorResponse(
                ['number_of_guests' => ['The number of guests field is required and must be at least 1.']],
                'Number of guests is required and must be at least 1'
            );
        }

        // Check capacity if package has a capacity field
        if (isset($package->capacity) && $guestCount > $package->capacity) {
            return $this->validationErrorResponse(
                ['guest_count' => ['Number of guests exceeds package capacity.']],
                'Number of guests exceeds package capacity'
            );
        }

        // Get event venue from request or package venue, or use a default
        $eventVenue = $request->event_venue;
        if (!$eventVenue && $package->venue) {
            $eventVenue = $package->venue->name ?? 'Venue to be determined';
        }
        if (!$eventVenue) {
            $eventVenue = 'Venue to be determined';
        }

        // Find or create corresponding client based on authenticated user
        $client = $this->clientService->findOrCreateFromUser($request->user());

        // Calculate payment amounts with strict decimal precision
        // Ensure package_price is valid decimal
        if (!is_numeric($package->package_price) || $package->package_price < 0) {
            return response()->json([
                'message' => 'Invalid package price',
                'errors' => ['package_price' => ['The package price is invalid.']]
            ], 422);
        }

        $totalAmount = round((float) $package->package_price, 2);
        $depositPercentage = 0.30; // 30% deposit (configurable via config file if needed)
        $depositAmount = round($totalAmount * $depositPercentage, 2);

        // Validate calculated amounts
        if ($totalAmount <= 0) {
            return response()->json([
                'message' => 'Package price must be greater than zero',
                'errors' => ['package_price' => ['The package price must be greater than zero.']]
            ], 422);
        }

        $bookingData = [
            'client_id' => $client->client_id,
            'package_id' => $request->package_id,
            'event_date' => $request->event_date,
            'event_venue' => $eventVenue,
            'guest_count' => $guestCount,
            'special_requests' => $request->special_requests,
            'event_type' => $request->event_type,
            'theme' => $request->theme,
            'budget_range' => $request->budget_range,
            'alternate_contact' => $request->alternate_contact,
            'booking_status' => 'Pending',
            'total_amount' => $totalAmount,
            'deposit_amount' => $depositAmount,
            'payment_required' => true,
            'payment_status' => 'unpaid',
        ];

        // Add event_time if provided
        if ($request->has('event_time') && $request->event_time !== null && $request->event_time !== '') {
            $bookingData['event_time'] = $request->event_time;
        }

        $booking = BookingDetail::create($bookingData);

        // Load relationships for email
        $booking->load(['client', 'eventPackage']);

        // Send booking confirmation email
        try {
            if ($client->client_email) {
                Mail::to($client->client_email)->send(new BookingConfirmationMail($booking));
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to send booking confirmation email: ' . $e->getMessage());
        }

        // Broadcast new booking event to admins
        try {
            broadcast(new NewBookingCreated($booking))->toOthers();
        } catch (\Exception $e) {
            Log::error('Failed to broadcast new booking event: ' . $e->getMessage());
        }

        return $this->successResponse(new BookingResource($booking), 'Booking created successfully', 201);
    }

    public function update(\App\Http\Requests\Booking\UpdateBookingRequest $request, $id)
    {
        $booking = BookingDetail::findOrFail($id);

        // Check if user owns the booking
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if ($client && $booking->client_id !== $client->client_id && !$request->user()->isAdmin()) {
            return $this->forbiddenResponse('Unauthorized');
        }

        // Validation handled by FormRequest

        // Map number_of_guests to guest_count if provided
        $data = $request->only([
            'event_date',
            'event_time',
            'event_venue',
            'guest_count',
            'special_requests',
            'event_type',
            'theme',
            'budget_range',
            'alternate_contact'
        ]);
        if ($request->has('number_of_guests') && $request->number_of_guests !== '' && $request->number_of_guests !== null) {
            $data['guest_count'] = (int) $request->number_of_guests;
        }

        // Handle event_time - set to null if empty string
        if (isset($data['event_time']) && $data['event_time'] === '') {
            $data['event_time'] = null;
        }

        $booking->update($data);

        return $this->successResponse(new BookingResource($booking), 'Booking updated successfully');
    }

    public function adminUpdateStatus(Request $request, $id)
    {
        $booking = BookingDetail::with(['client', 'eventPackage'])->findOrFail($id);

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'status' => 'required|in:Pending,Approved,Confirmed,Completed,Cancelled',
        ]);

        // Store old status before update
        $oldStatus = $booking->booking_status;

        // Map "Confirmed" to "Approved" for database consistency
        $status = $request->status;
        if ($status === 'Confirmed') {
            $status = 'Approved';
        }

        $booking->update(['booking_status' => $status]);

        // Reload booking with relationships
        $booking->refresh();
        $booking->load(['client', 'eventPackage']);

        // Log the status change
        $this->logAudit(
            'booking.status_changed',
            $booking,
            ['booking_status' => $oldStatus],
            ['booking_status' => $status],
            "Changed booking #{$booking->booking_id} status from '{$oldStatus}' to '{$status}'"
        );

        // Send status update email if status actually changed
        if ($oldStatus !== $status && $booking->client && $booking->client->client_email) {
            try {
                Mail::to($booking->client->client_email)->send(
                    new BookingStatusUpdateMail($booking, $oldStatus, $status)
                );
            } catch (\Exception $e) {
                // Log error but don't fail the request
                Log::error('Failed to send booking status update email: ' . $e->getMessage());
            }
        }

        // Broadcast status change event for real-time notifications
        if ($oldStatus !== $status) {
            try {
                broadcast(new BookingStatusChanged($booking, $oldStatus, $status))->toOthers();
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking status change: ' . $e->getMessage());
            }
        }

        return $this->successResponse(new BookingResource($booking), 'Booking updated successfully');
    }

    /**
     * Bulk update status for multiple bookings (admin only)
     */
    public function bulkUpdateStatus(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'booking_ids' => 'required|array|min:1|max:100',
            'booking_ids.*' => 'required|integer',
            'status' => 'required|in:Pending,Approved,Confirmed,Completed,Cancelled',
        ]);

        $bookingIds = $request->booking_ids;
        $newStatus = $request->status;

        // Map "Confirmed" to "Approved" for database consistency
        if ($newStatus === 'Confirmed') {
            $newStatus = 'Approved';
        }

        $bookings = BookingDetail::with(['client', 'eventPackage'])
            ->whereIn('booking_id', $bookingIds)
            ->get();

        if ($bookings->isEmpty()) {
            return response()->json(['message' => 'No bookings found with the provided IDs.'], 404);
        }

        $successCount = 0;
        $failedIds = [];
        $results = [];

        foreach ($bookings as $booking) {
            /** @var BookingDetail $booking */
            try {
                $oldStatus = $booking->booking_status;

                // Skip if status is the same
                if ($oldStatus === $newStatus) {
                    $results[] = [
                        'booking_id' => $booking->booking_id,
                        'status' => 'skipped',
                        'message' => 'Status unchanged'
                    ];
                    continue;
                }

                $booking->update(['booking_status' => $newStatus]);
                $booking->refresh();

                // Log the status change
                $this->logAudit(
                    'booking.bulk_status_changed',
                    $booking,
                    ['booking_status' => $oldStatus],
                    ['booking_status' => $newStatus],
                    "Bulk updated booking #{$booking->booking_id} status from '{$oldStatus}' to '{$newStatus}'"
                );

                // Send status update email
                if ($booking->client && $booking->client->client_email) {
                    try {
                        Mail::to($booking->client->client_email)->send(
                            new BookingStatusUpdateMail($booking, $oldStatus, $newStatus)
                        );
                    } catch (\Exception $e) {
                        Log::error("Failed to send bulk status update email for booking #{$booking->booking_id}: " . $e->getMessage());
                    }
                }

                // Broadcast status change event
                try {
                    broadcast(new BookingStatusChanged($booking, $oldStatus, $newStatus))->toOthers();
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast bulk status change for booking #{$booking->booking_id}: " . $e->getMessage());
                }

                $successCount++;
                $results[] = [
                    'booking_id' => $booking->booking_id,
                    'status' => 'success',
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus
                ];
            } catch (\Exception $e) {
                Log::error("Failed to bulk update booking #{$booking->booking_id}: " . $e->getMessage());
                $failedIds[] = $booking->booking_id;
                $results[] = [
                    'booking_id' => $booking->booking_id,
                    'status' => 'failed',
                    'message' => $e->getMessage()
                ];
            }
        }

        $message = $successCount > 0
            ? "Successfully updated {$successCount} booking(s) to '{$newStatus}'."
            : 'No bookings were updated.';

        if (count($failedIds) > 0) {
            $message .= " Failed to update " . count($failedIds) . " booking(s).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'success_count' => $successCount,
                'failed_count' => count($failedIds),
                'results' => $results
            ]
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/bookings/{id}/cancel",
     *     summary="Cancel a booking (client-initiated)",
     *     tags={"Bookings"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Booking ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="cancellation_reason", type="string", example="Change of plans", description="Optional reason for cancellation")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Booking cancelled successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Booking cancelled successfully"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Cannot cancel this booking"),
     *     @OA\Response(response=403, description="Unauthorized - booking does not belong to user"),
     *     @OA\Response(response=404, description="Booking not found")
     * )
     */
    public function cancel(Request $request, $id)
    {
        $booking = BookingDetail::with(['client', 'eventPackage'])->findOrFail($id);

        // Check if user owns the booking
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client || $booking->client_id !== $client->client_id) {
            return response()->json([
                'message' => 'Unauthorized. You can only cancel your own bookings.'
            ], 403);
        }

        // Validate cancellation is allowed
        $currentStatus = $booking->booking_status;

        // Cannot cancel if already completed or cancelled
        if ($currentStatus === 'Completed') {
            return response()->json([
                'message' => 'Cannot cancel a completed booking.'
            ], 400);
        }

        if ($currentStatus === 'Cancelled') {
            return response()->json([
                'message' => 'This booking is already cancelled.'
            ], 400);
        }

        // Check if event date is too close (within 7 days)
        if ($booking->event_date) {
            $eventDate = Carbon::parse($booking->event_date);
            $daysUntilEvent = Carbon::now()->diffInDays($eventDate, false);

            if ($daysUntilEvent >= 0 && $daysUntilEvent < 7) {
                return response()->json([
                    'message' => 'Cannot cancel booking less than 7 days before the event date. Please contact support for assistance.'
                ], 400);
            }
        }

        // Store old status before update
        $oldStatus = $booking->booking_status;

        // Update booking status to Cancelled
        $updateData = ['booking_status' => 'Cancelled'];

        // Store cancellation reason if provided
        if ($request->has('cancellation_reason') && $request->cancellation_reason) {
            // Add cancellation reason to special_requests or create a new field
            // For now, we'll append it to special_requests
            $existingRequests = $booking->special_requests ?? '';
            $cancellationNote = "\n\n[Cancellation Reason: " . $request->cancellation_reason . "]";
            $updateData['special_requests'] = $existingRequests . $cancellationNote;
        }

        $booking->update($updateData);

        // Reload booking with relationships
        $booking->refresh();
        $booking->load(['client', 'eventPackage']);

        // Log the cancellation
        $this->logAudit(
            'booking.cancelled',
            $booking,
            ['booking_status' => $oldStatus],
            ['booking_status' => 'Cancelled'],
            "Client cancelled booking #{$booking->booking_id} (was: {$oldStatus})"
        );

        // Send cancellation email notification
        if ($booking->client && $booking->client->client_email) {
            try {
                Mail::to($booking->client->client_email)->send(
                    new BookingStatusUpdateMail($booking, $oldStatus, 'Cancelled')
                );
            } catch (\Exception $e) {
                // Log error but don't fail the request
                Log::error('Failed to send booking cancellation email: ' . $e->getMessage());
            }
        }

        // Broadcast cancellation event for real-time notifications
        try {
            broadcast(new BookingStatusChanged($booking, $oldStatus, 'Cancelled'))->toOthers();
        } catch (\Exception $e) {
            Log::error('Failed to broadcast booking cancellation: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'data' => $booking,
        ]);
    }

    /**
     * Get past events (completed bookings) for coordinators/admins
     */
    public function getPastEvents(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $query = BookingDetail::with(['eventPackage', 'client'])
            ->where('booking_status', 'Completed');

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('event_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('event_date', '<=', $request->end_date);
        }

        // Filter by package if provided
        if ($request->has('package_id')) {
            $query->where('package_id', $request->package_id);
        }

        // Filter by client if provided
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Sort by event date (most recent first)
        $pastEvents = $query->orderBy('event_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate statistics
        $stats = [
            'total_past_events' => $pastEvents->count(),
            'total_guests' => $pastEvents->sum('guest_count'),
            'unique_clients' => $pastEvents->pluck('client_id')->unique()->count(),
            'unique_packages' => $pastEvents->pluck('package_id')->unique()->count(),
        ];

        return response()->json([
            'data' => $pastEvents,
            'statistics' => $stats,
        ]);
    }

    /**
     * Export bookings as CSV (admin/coordinator only)
     */
    public function export(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $fileName = 'bookings_export_' . now()->format('Y_m_d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        $query = BookingDetail::with(['eventPackage', 'client'])
            ->orderBy('event_date')
            ->orderBy('created_at');

        if ($request->filled('status')) {
            $query->where('booking_status', $request->status);
        }

        if ($request->filled('start_date')) {
            $query->where('event_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('event_date', '<=', $request->end_date);
        }

        $columns = [
            'Booking ID',
            'Client Name',
            'Client Email',
            'Package',
            'Event Date',
            'Event Time',
            'Venue',
            'Guests',
            'Status',
            'Created At',
        ];

        $callback = function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            $query->chunk(500, function ($bookings) use ($handle) {
                foreach ($bookings as $booking) {
                    $clientName = $booking->client
                        ? trim(($booking->client->client_fname ?? '') . ' ' . ($booking->client->client_lname ?? ''))
                        : '';
                    $clientEmail = $booking->client->client_email ?? $booking->client->email ?? '';
                    $packageName = $booking->eventPackage->package_name ?? $booking->eventPackage->name ?? '';

                    fputcsv($handle, [
                        $booking->booking_id,
                        $clientName,
                        $clientEmail,
                        $packageName,
                        $booking->event_date ? Carbon::parse($booking->event_date)->toDateString() : '',
                        $booking->event_time ?? '',
                        $booking->event_venue ?? '',
                        $booking->guest_count ?? '',
                        $booking->booking_status ?? '',
                        $booking->created_at ? $booking->created_at->toDateTimeString() : '',
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Calendar view data for admins/coordinators.
     * Supports start_date/end_date (Y-m-d). Defaults to current month.
     */
    public function calendar(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $start = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : now()->startOfMonth();

        $end = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : now()->endOfMonth();

        $bookings = BookingDetail::with(['eventPackage', 'client'])
            ->whereBetween('event_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('event_date')
            ->get();

        // Aggregate status counts in range
        $statusCounts = $bookings
            ->groupBy(function ($b) {
                return strtolower($b->booking_status ?? 'unknown');
            })
            ->map->count();

        $events = $bookings->map(function ($booking) {
            return [
                'id' => $booking->booking_id,
                'date' => $booking->event_date ? Carbon::parse($booking->event_date)->toDateString() : null,
                'time' => $booking->event_time,
                'status' => $booking->booking_status,
                'package' => $booking->eventPackage?->package_name,
                'client' => $booking->client
                    ? trim(($booking->client->client_fname ?? '') . ' ' . ($booking->client->client_lname ?? ''))
                    : null,
                'venue' => $booking->event_venue,
                'guest_count' => $booking->guest_count,
            ];
        })->filter(fn($e) => $e['date']);

        return response()->json([
            'data' => $events->values(),
            'meta' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'status_counts' => $statusCounts,
            ],
        ]);
    }

    /**
     * Get analytics data for dashboard
     */
    public function analytics(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        // Date range (default to last 30 days)
        $startDate = $request->query('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', Carbon::now()->toDateString());

        // Booking Statistics
        $totalBookings = BookingDetail::whereBetween('created_at', [$startDate, $endDate])->count();
        $bookingsByStatus = BookingDetail::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('booking_status, COUNT(*) as count')
            ->groupBy('booking_status')
            ->pluck('count', 'booking_status')
            ->toArray();

        // Revenue calculation (sum of package prices for approved/completed bookings)
        $revenue = BookingDetail::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('booking_status', ['Approved', 'Completed'])
            ->with('eventPackage')
            ->get()
            ->sum(function ($booking) {
                return $booking->eventPackage ? round((float) $booking->eventPackage->package_price, 2) : 0;
            });

        // Monthly revenue trend (last 6 months)
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $monthRevenue = BookingDetail::whereBetween('created_at', [$monthStart, $monthEnd])
                ->whereIn('booking_status', ['Approved', 'Completed'])
                ->with('eventPackage')
                ->get()
                ->sum(function ($booking) {
                    return $booking->eventPackage ? round((float) $booking->eventPackage->package_price, 2) : 0;
                });
            $monthlyRevenue[] = [
                'month' => $monthStart->format('M Y'),
                'revenue' => round($monthRevenue, 2),
            ];
        }

        // Popular Packages (top 5 by booking count)
        $popularPackages = BookingDetail::whereBetween('created_at', [$startDate, $endDate])
            ->with('eventPackage')
            ->get()
            ->groupBy('package_id')
            ->map(function ($bookings) {
                return [
                    'package_id' => $bookings->first()->package_id,
                    'package_name' => $bookings->first()->eventPackage->package_name ?? 'N/A',
                    'booking_count' => $bookings->count(),
                    'total_revenue' => round($bookings->sum(function ($booking) {
                        return $booking->eventPackage ? round((float) $booking->eventPackage->package_price, 2) : 0;
                    }), 2),
                ];
            })
            ->sortByDesc('booking_count')
            ->take(5)
            ->values();

        // Client Metrics
        $totalClients = Client::whereBetween('created_at', [$startDate, $endDate])->count();
        $clientsWithBookings = BookingDetail::whereBetween('created_at', [$startDate, $endDate])
            ->distinct('client_id')
            ->count('client_id');

        // Contact Inquiries
        $totalInquiries = \App\Models\ContactInquiry::whereBetween('created_at', [$startDate, $endDate])->count();
        $inquiriesByStatus = \App\Models\ContactInquiry::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Recent Bookings (last 10)
        $recentBookings = BookingDetail::with(['client', 'eventPackage'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->booking_id,
                    'client_name' => $booking->client
                        ? ($booking->client->client_fname . ' ' . $booking->client->client_lname)
                        : 'N/A',
                    'package_name' => $booking->eventPackage->package_name ?? 'N/A',
                    'event_date' => $booking->event_date ? Carbon::parse($booking->event_date)->toDateString() : null,
                    'status' => $booking->booking_status,
                    'created_at' => $booking->created_at->toDateTimeString(),
                ];
            });

        return response()->json([
            'data' => [
                'overview' => [
                    'total_bookings' => $totalBookings,
                    'total_revenue' => round($revenue, 2),
                    'total_clients' => $totalClients,
                    'total_inquiries' => $totalInquiries,
                ],
                'bookings_by_status' => $bookingsByStatus,
                'monthly_revenue' => $monthlyRevenue,
                'popular_packages' => $popularPackages,
                'client_metrics' => [
                    'total_clients' => $totalClients,
                    'clients_with_bookings' => $clientsWithBookings,
                ],
                'inquiries_by_status' => $inquiriesByStatus,
                'recent_bookings' => $recentBookings,
            ],
            'meta' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Assign a coordinator to a booking (Admin only)
     */
    public function assignCoordinator(Request $request, $id)
    {
        $request->validate([
            'coordinator_id' => 'required|exists:users,id',
        ]);

        $booking = BookingDetail::findOrFail($id);

        // Verify coordinator exists and is actually a coordinator
        $coordinator = User::findOrFail($request->coordinator_id);
        if (!$coordinator->isCoordinator()) {
            return response()->json([
                'message' => 'The specified user is not a coordinator.'
            ], 400);
        }

        $oldCoordinatorId = $booking->coordinator_id;
        $booking->coordinator_id = $request->coordinator_id;
        $booking->save();

        $booking->load(['coordinator', 'client', 'eventPackage']);

        // Log the assignment
        $this->logAudit(
            'booking.coordinator_assigned',
            $booking,
            ['coordinator_id' => $oldCoordinatorId],
            ['coordinator_id' => $request->coordinator_id],
            "Assigned coordinator {$coordinator->name} to booking #{$booking->booking_id}"
        );

        return response()->json([
            'message' => 'Coordinator assigned successfully.',
            'data' => $booking,
        ]);
    }

    /**
     * Unassign coordinator from a booking (Admin only)
     */
    public function unassignCoordinator($id)
    {
        $booking = BookingDetail::with('coordinator')->findOrFail($id);
        $oldCoordinatorId = $booking->coordinator_id;
        $coordinatorName = $booking->coordinator ? $booking->coordinator->name : 'Unknown';

        $booking->coordinator_id = null;
        $booking->save();

        $booking->load(['coordinator', 'client', 'eventPackage']);

        // Log the unassignment
        $this->logAudit(
            'booking.coordinator_unassigned',
            $booking,
            ['coordinator_id' => $oldCoordinatorId],
            ['coordinator_id' => null],
            "Unassigned coordinator {$coordinatorName} from booking #{$booking->booking_id}"
        );

        return response()->json([
            'message' => 'Coordinator unassigned successfully.',
            'data' => $booking,
        ]);
    }

    /**
     * Get all coordinators (for dropdown/selection)
     */
    public function getCoordinators()
    {
        $coordinators = User::where('role', 'coordinator')
            ->select('id', 'name', 'email', 'phone')
            ->get();

        return response()->json([
            'data' => $coordinators,
        ]);
    }

    /**
     * Get coordinator's assigned bookings
     */
    public function getCoordinatorBookings(Request $request)
    {
        $user = $request->user();

        if (!$user->isCoordinator()) {
            return response()->json([
                'message' => 'Only coordinators can access this endpoint.'
            ], 403);
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min($perPage, 100));
        $page = (int) $request->query('page', 1);
        $page = max(1, $page);

        $query = BookingDetail::with(['eventPackage', 'client'])
            ->where('coordinator_id', $user->id);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('booking_status', $request->status);
        }

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('event_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('event_date', '<=', $request->end_date);
        }

        $bookings = $query->orderByDesc('event_date')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
                'last_page' => $bookings->lastPage(),
            ],
        ]);
    }

    /**
     * Add or update internal notes for a booking (Admin/Coordinator only)
     */
    public function updateNotes(Request $request, $id)
    {
        $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);

        $booking = BookingDetail::findOrFail($id);

        // Check if user has permission (admin or assigned coordinator)
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin or coordinator access required.'
            ], 403);
        }

        // If coordinator, check if they're assigned to this booking
        if ($user->isCoordinator() && $booking->coordinator_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only add notes to bookings assigned to you.'
            ], 403);
        }

        $oldNotes = $booking->internal_notes;
        $booking->internal_notes = $request->notes;
        $booking->save();

        $booking->load(['coordinator', 'client', 'eventPackage']);

        // Log the notes update
        $this->logAudit(
            'booking.notes_updated',
            $booking,
            ['internal_notes' => $oldNotes],
            ['internal_notes' => $request->notes],
            "Updated notes for booking #{$booking->booking_id}"
        );

        return response()->json([
            'message' => 'Notes updated successfully.',
            'data' => $booking,
        ]);
    }

    /**
     * Check if a date is available for a package
     */
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:event_packages,package_id',
            'event_date' => 'required|date',
        ]);

        $eventDate = Carbon::parse($request->event_date)->startOfDay();
        $isAvailable = $this->checkDateAvailability($request->package_id, $eventDate);

        return response()->json([
            'available' => $isAvailable,
            'date' => $eventDate->format('Y-m-d'),
            'package_id' => $request->package_id,
        ]);
    }

    /**
     * Get available dates for a package within a date range
     */
    public function getAvailableDates(Request $request)
    {
        try {
            $request->validate([
                'package_id' => 'required|exists:event_packages,package_id',
                'start_date' => 'nullable|date|after_or_equal:today',
                'end_date' => 'nullable|date|after:start_date',
                'months_ahead' => 'nullable|integer|min:1|max:12',
            ]);

            $packageId = $request->package_id;
            $startDate = $request->start_date
                ? Carbon::parse($request->start_date)->startOfDay()
                : Carbon::today()->startOfDay();

            $monthsAhead = $request->has('months_ahead')
                ? (int) $request->months_ahead
                : 3;

            $endDate = $request->end_date
                ? Carbon::parse($request->end_date)->startOfDay()
                : $startDate->copy()->addMonths($monthsAhead);

            $availableDates = [];
            $unavailableDates = [];

            // Get all bookings for this package in the date range
            $bookings = BookingDetail::where('package_id', $packageId)
                ->whereDate('event_date', '>=', $startDate->format('Y-m-d'))
                ->whereDate('event_date', '<=', $endDate->format('Y-m-d'))
                ->whereIn('booking_status', ['Pending', 'Approved', 'Confirmed'])
                ->pluck('event_date')
                ->map(function ($date) {
                    // Handle both Carbon instances and date strings
                    if ($date instanceof Carbon) {
                        return $date->format('Y-m-d');
                    }
                    return Carbon::parse($date)->format('Y-m-d');
                })
                ->toArray();

            // Generate all dates in range
            $currentDate = $startDate->copy();
            while ($currentDate->lte($endDate)) {
                $dateString = $currentDate->format('Y-m-d');
                if (!in_array($dateString, $bookings)) {
                    $availableDates[] = $dateString;
                } else {
                    $unavailableDates[] = $dateString;
                }
                $currentDate->addDay();
            }

            return response()->json([
                'package_id' => $packageId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'available_dates' => $availableDates,
                'unavailable_dates' => $unavailableDates,
                'total_available' => count($availableDates),
                'total_unavailable' => count($unavailableDates),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in getAvailableDates: ' . $e->getMessage(), [
                'package_id' => $request->package_id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to fetch available dates',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Helper method to check if a date is available for a package
     * 
     * @param int $packageId The package ID to check
     * @param Carbon $eventDate The date to check
     * @param string|null $eventTime Optional time slot to check (format: HH:MM)
     * @param bool $strictMode If true, only Approved/Confirmed/Completed block the date
     *                         If false (default), also includes Pending bookings
     * @return bool True if the date/time is available
     */
    protected function checkDateAvailability($packageId, Carbon $eventDate, ?string $eventTime = null, bool $strictMode = false): bool
    {
        $query = BookingDetail::where('package_id', $packageId)
            ->whereDate('event_date', $eventDate->format('Y-m-d'));

        if ($strictMode) {
            // Only approved/confirmed/completed bookings block the date
            // This is useful for showing "tentatively booked" vs "confirmed booking"
            $query->whereIn('booking_status', ['Approved', 'Confirmed', 'Completed']);
        } else {
            // All non-cancelled bookings block the date (including Pending)
            $query->whereNotIn('booking_status', ['Cancelled', 'Completed']);
        }

        // If time is provided, also check for time conflicts
        if ($eventTime) {
            $query->where('event_time', $eventTime);
        }

        return !$query->exists();
    }

    /**
     * Helper method to get detailed availability info for a date
     * 
     * @param int $packageId The package ID to check
     * @param Carbon $eventDate The date to check
     * @return array Availability info including conflicting bookings
     */
    protected function getDateAvailabilityDetails($packageId, Carbon $eventDate): array
    {
        $conflictingBookings = BookingDetail::where('package_id', $packageId)
            ->whereDate('event_date', $eventDate->format('Y-m-d'))
            ->whereNotIn('booking_status', ['Cancelled', 'Completed'])
            ->select(['booking_id', 'event_time', 'booking_status', 'client_id'])
            ->with('client:client_id,client_fname,client_lname')
            ->get();

        $pendingCount = $conflictingBookings->where('booking_status', 'Pending')->count();
        $approvedCount = $conflictingBookings->whereIn('booking_status', ['Approved', 'Confirmed'])->count();

        return [
            'is_available' => $conflictingBookings->isEmpty(),
            'has_approved_booking' => $approvedCount > 0,
            'has_pending_booking' => $pendingCount > 0,
            'pending_count' => $pendingCount,
            'approved_count' => $approvedCount,
            'conflicting_bookings' => $conflictingBookings->map(function ($booking) {
                return [
                    'booking_id' => $booking->booking_id,
                    'event_time' => $booking->event_time,
                    'event_duration' => $booking->event_duration,
                    'event_end_time' => $booking->event_end_time,
                    'status' => $booking->booking_status,
                    'client_name' => $booking->client
                        ? trim(($booking->client->client_fname ?? '') . ' ' . ($booking->client->client_lname ?? ''))
                        : null,
                ];
            })->values(),
        ];
    }

    /**
     * Check detailed availability for a date (admin endpoint)
     */
    public function checkAvailabilityDetails(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'package_id' => 'required|exists:event_packages,package_id',
            'event_date' => 'required|date',
        ]);

        $eventDate = Carbon::parse($request->event_date)->startOfDay();
        $details = $this->getDateAvailabilityDetails($request->package_id, $eventDate);

        return response()->json([
            'package_id' => $request->package_id,
            'date' => $eventDate->format('Y-m-d'),
            ...$details,
        ]);
    }

    /**
     * Check if a time slot is available (no overlapping bookings)
     * 
     * @param int $packageId The package ID
     * @param Carbon $eventDate The event date
     * @param string $startTime Start time in HH:MM format
     * @param float $durationHours Duration in hours (e.g., 2.5 for 2:30)
     * @param int|null $excludeBookingId Optional booking ID to exclude (for updates)
     * @return array ['available' => bool, 'conflicts' => array]
     */
    protected function checkTimeSlotAvailability(
        int $packageId,
        Carbon $eventDate,
        string $startTime,
        float $durationHours,
        ?int $excludeBookingId = null
    ): array {
        // Calculate end time
        $startMinutes = $this->timeToMinutes($startTime);
        $endMinutes = $startMinutes + (int) ($durationHours * 60);
        $endTime = $this->minutesToTime($endMinutes);

        // Get all active bookings for this date and package
        $query = BookingDetail::where('package_id', $packageId)
            ->whereDate('event_date', $eventDate->format('Y-m-d'))
            ->whereNotIn('booking_status', ['Cancelled', 'Completed'])
            ->whereNotNull('event_time');

        if ($excludeBookingId) {
            $query->where('booking_id', '!=', $excludeBookingId);
        }

        $existingBookings = $query->get();

        $conflicts = [];

        foreach ($existingBookings as $booking) {
            $existingStart = $this->timeToMinutes($booking->event_time);

            // Calculate existing booking's end time
            $existingDuration = $booking->event_duration ?? 4; // Default 4 hours if not set
            $existingEnd = $existingStart + (int) ($existingDuration * 60);

            // Check for overlap: two ranges overlap if they start before the other ends
            // Overlap condition: start1 < end2 AND start2 < end1
            if ($startMinutes < $existingEnd && $existingStart < $endMinutes) {
                $conflicts[] = [
                    'booking_id' => $booking->booking_id,
                    'status' => $booking->booking_status,
                    'time_range' => "{$booking->event_time} - " . $this->minutesToTime($existingEnd),
                    'overlap_type' => $this->getOverlapType($startMinutes, $endMinutes, $existingStart, $existingEnd),
                ];
            }
        }

        return [
            'available' => empty($conflicts),
            'requested_slot' => [
                'start_time' => $startTime,
                'end_time' => $endTime,
                'duration_hours' => $durationHours,
            ],
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Convert time string (HH:MM) to minutes from midnight
     */
    protected function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int) $parts[0] * 60 + (int) ($parts[1] ?? 0);
    }

    /**
     * Convert minutes from midnight to time string (HH:MM)
     */
    protected function minutesToTime(int $minutes): string
    {
        $hours = (int) floor($minutes / 60) % 24;
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    /**
     * Determine the type of time overlap
     */
    protected function getOverlapType(int $start1, int $end1, int $start2, int $end2): string
    {
        if ($start1 >= $start2 && $end1 <= $end2) {
            return 'contained'; // New booking is fully within existing
        }
        if ($start2 >= $start1 && $end2 <= $end1) {
            return 'contains'; // New booking fully contains existing
        }
        if ($start1 < $start2) {
            return 'overlaps_start'; // New booking overlaps start of existing
        }
        return 'overlaps_end'; // New booking overlaps end of existing
    }

    /**
     * Calculate and set end time based on start time and duration
     */
    protected function calculateEndTime(?string $startTime, ?float $durationHours): ?string
    {
        if (!$startTime || !$durationHours) {
            return null;
        }

        $startMinutes = $this->timeToMinutes($startTime);
        $endMinutes = $startMinutes + (int) ($durationHours * 60);

        return $this->minutesToTime($endMinutes);
    }

    /**
     * Get public statistics for the home page
     */
    public function getPublicStats()
    {
        $eventsPlanned = BookingDetail::whereIn('booking_status', ['Completed', 'Confirmed', 'Approved', 'Paid'])->count();

        $happyClients = BookingDetail::whereIn('booking_status', ['Completed', 'Confirmed', 'Approved', 'Paid'])
            ->distinct('client_id')
            ->count('client_id');

        $avgRating = Review::avg('rating') ?? 0;

        // Years experience is static for the company
        $yearsExperience = 15;

        return response()->json([
            'happy_clients' => $happyClients,
            'events_planned' => $eventsPlanned,
            'average_rating' => round($avgRating, 1),
            'years_experience' => $yearsExperience,
            'success' => true
        ]);
    }
}

