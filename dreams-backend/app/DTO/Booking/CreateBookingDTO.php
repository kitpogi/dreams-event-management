<?php

namespace App\DTO\Booking;

use App\DTO\BaseDTO;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Create Booking DTO
 * 
 * Encapsulates all data needed to create a new booking.
 */
class CreateBookingDTO extends BaseDTO
{
    public function __construct(
        public readonly int $packageId,
        public readonly string $eventDate,
        public readonly ?string $eventVenue = null,
        public readonly ?string $eventTime = null,
        public readonly ?int $guestCount = null,
        public readonly ?string $specialRequests = null,
        public readonly ?int $venueId = null,
        public readonly ?string $eventTheme = null,
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(Request $request): static
    {
        return new static(
            packageId: (int) $request->input('package_id'),
            eventDate: $request->input('event_date'),
            eventVenue: $request->input('event_venue'),
            eventTime: $request->input('event_time'),
            guestCount: $request->input('guest_count') ? (int) $request->input('guest_count') : null,
            specialRequests: $request->input('special_requests'),
            venueId: $request->input('venue_id') ? (int) $request->input('venue_id') : null,
            eventTheme: $request->input('event_theme'),
        );
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            packageId: (int) ($data['package_id'] ?? $data['packageId'] ?? 0),
            eventDate: $data['event_date'] ?? $data['eventDate'] ?? '',
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
        );
    }

    /**
     * Get the event date as a Carbon instance.
     */
    public function getEventDateCarbon(): Carbon
    {
        return Carbon::parse($this->eventDate);
    }

    /**
     * Check if the event date is in the future.
     */
    public function isEventDateFuture(): bool
    {
        return $this->getEventDateCarbon()->isFuture();
    }

    /**
     * Convert to array suitable for database insertion.
     */
    public function toDatabaseArray(): array
    {
        return [
            'package_id' => $this->packageId,
            'event_date' => $this->eventDate,
            'event_venue' => $this->eventVenue,
            'event_time' => $this->eventTime,
            'guest_count' => $this->guestCount,
            'special_requests' => $this->specialRequests,
            'venue_id' => $this->venueId,
            'event_theme' => $this->eventTheme,
        ];
    }
}
