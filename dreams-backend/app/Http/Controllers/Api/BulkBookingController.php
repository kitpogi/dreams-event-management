<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\HandlesBulkOperations;
use App\Models\BookingDetail;

/**
 * Controller for bulk booking operations.
 * 
 * Admin/Coordinator endpoints for managing multiple bookings at once.
 */
class BulkBookingController extends Controller
{
    use HandlesBulkOperations;

    /**
     * @inheritDoc
     */
    protected function getBulkModel(): string
    {
        return BookingDetail::class;
    }

    /**
     * @inheritDoc
     */
    protected function getBulkCreateRules(): array
    {
        return [
            'client_id' => 'required|exists:clients,id',
            'package_id' => 'required|exists:event_packages,id',
            'venue_id' => 'nullable|exists:venues,id',
            'event_date' => 'required|date|after:today',
            'event_time' => 'nullable|date_format:H:i',
            'guest_count' => 'required|integer|min:1',
            'special_requests' => 'nullable|string|max:1000',
        ];
    }

    /**
     * @inheritDoc
     */
    protected function getBulkUpdateRules(): array
    {
        return [
            'event_date' => 'date|after:today',
            'event_time' => 'date_format:H:i',
            'guest_count' => 'integer|min:1',
            'special_requests' => 'string|max:1000',
        ];
    }

    /**
     * @inheritDoc
     */
    protected function getAllowedStatuses(): array
    {
        return ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    }

    /**
     * @inheritDoc
     */
    protected function getStatusField(): string
    {
        return 'booking_status';
    }
}
