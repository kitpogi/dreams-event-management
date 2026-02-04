<?php

namespace App\DTO\Booking;

use App\DTO\BaseDTO;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Update Booking DTO
 * 
 * Encapsulates data for updating an existing booking.
 * All fields are optional since partial updates are allowed.
 */
class UpdateBookingDTO extends BaseDTO
{
    public function __construct(
        public readonly ?string $eventDate = null,
        public readonly ?string $eventVenue = null,
        public readonly ?string $eventTime = null,
        public readonly ?int $guestCount = null,
        public readonly ?string $specialRequests = null,
        public readonly ?int $venueId = null,
        public readonly ?string $eventTheme = null,
        public readonly ?string $status = null,
        public readonly ?string $notes = null,
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(Request $request): static
    {
        return new static(
            eventDate: $request->input('event_date'),
            eventVenue: $request->input('event_venue'),
            eventTime: $request->input('event_time'),
            guestCount: $request->has('guest_count') ? (int) $request->input('guest_count') : null,
            specialRequests: $request->input('special_requests'),
            venueId: $request->has('venue_id') ? (int) $request->input('venue_id') : null,
            eventTheme: $request->input('event_theme'),
            status: $request->input('booking_status') ?? $request->input('status'),
            notes: $request->input('notes'),
        );
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            eventDate: $data['event_date'] ?? $data['eventDate'] ?? null,
            eventVenue: $data['event_venue'] ?? $data['eventVenue'] ?? null,
            eventTime: $data['event_time'] ?? $data['eventTime'] ?? null,
            guestCount: isset($data['guest_count']) || isset($data['guestCount']) 
                ? (int) ($data['guest_count'] ?? $data['guestCount']) 
                : null,
            specialRequests: $data['special_requests'] ?? $data['specialRequests'] ?? null,
            venueId: isset($data['venue_id']) || isset($data['venueId']) 
                ? (int) ($data['venue_id'] ?? $data['venueId']) 
                : null,
            eventTheme: $data['event_theme'] ?? $data['eventTheme'] ?? null,
            status: $data['booking_status'] ?? $data['status'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }

    /**
     * Get only the non-null values for database update.
     */
    public function getChangedAttributes(): array
    {
        $attributes = [];
        
        if ($this->eventDate !== null) {
            $attributes['event_date'] = $this->eventDate;
        }
        if ($this->eventVenue !== null) {
            $attributes['event_venue'] = $this->eventVenue;
        }
        if ($this->eventTime !== null) {
            $attributes['event_time'] = $this->eventTime;
        }
        if ($this->guestCount !== null) {
            $attributes['guest_count'] = $this->guestCount;
        }
        if ($this->specialRequests !== null) {
            $attributes['special_requests'] = $this->specialRequests;
        }
        if ($this->venueId !== null) {
            $attributes['venue_id'] = $this->venueId;
        }
        if ($this->eventTheme !== null) {
            $attributes['event_theme'] = $this->eventTheme;
        }
        if ($this->status !== null) {
            $attributes['booking_status'] = $this->status;
        }
        if ($this->notes !== null) {
            $attributes['notes'] = $this->notes;
        }
        
        return $attributes;
    }

    /**
     * Check if any changes were provided.
     */
    public function hasChanges(): bool
    {
        return !empty($this->getChangedAttributes());
    }

    /**
     * Check if status is being changed.
     */
    public function isStatusChange(): bool
    {
        return $this->status !== null;
    }
}
