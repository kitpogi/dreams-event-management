<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\EventPackage;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['package', 'user']);

        if ($request->user()->isAdmin()) {
            // Admin can see all bookings
        } else {
            // Clients can only see their own bookings
            $query->where('user_id', $request->user()->id);
        }

        $bookings = $query->get();

        return response()->json(['data' => $bookings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:event_packages,id',
            'event_date' => 'required|date|after:today',
            'event_time' => 'required|date_format:H:i',
            'number_of_guests' => 'required|integer|min:1',
            'special_requests' => 'nullable|string',
        ]);

        $package = EventPackage::findOrFail($request->package_id);

        if ($request->number_of_guests > $package->capacity) {
            return response()->json([
                'message' => 'Number of guests exceeds package capacity'
            ], 422);
        }

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'package_id' => $request->package_id,
            'event_date' => $request->event_date,
            'event_time' => $request->event_time,
            'number_of_guests' => $request->number_of_guests,
            'special_requests' => $request->special_requests,
            'status' => 'pending',
            'total_price' => $package->price,
        ]);

        return response()->json(['data' => $booking], 201);
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // Check if user owns the booking
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'event_date' => 'sometimes|date|after:today',
            'event_time' => 'sometimes|date_format:H:i',
            'number_of_guests' => 'sometimes|integer|min:1',
            'special_requests' => 'nullable|string',
        ]);

        $booking->update($request->all());

        return response()->json(['data' => $booking]);
    }

    public function adminUpdateStatus(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);

        $booking->update(['status' => $request->status]);

        return response()->json(['data' => $booking]);
    }
}

