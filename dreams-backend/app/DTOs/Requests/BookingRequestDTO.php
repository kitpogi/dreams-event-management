<?php

namespace App\DTOs\Requests;

class BookingRequestDTO
{
    public function __construct(
        public int $package_id,
        public string $event_date,
        public string $event_time,
        public string $event_venue,
        public int $guest_count,
        public string $special_requests,
        public ?float $deposit_amount = null,
        public ?string $payment_method = null,
        public ?string $notes = null,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            package_id: (int) $data['package_id'],
            event_date: $data['event_date'],
            event_time: $data['event_time'],
            event_venue: $data['event_venue'],
            guest_count: (int) $data['guest_count'],
            special_requests: $data['special_requests'],
            deposit_amount: isset($data['deposit_amount']) ? (float) $data['deposit_amount'] : null,
            payment_method: $data['payment_method'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'package_id' => $this->package_id,
            'event_date' => $this->event_date,
            'event_time' => $this->event_time,
            'event_venue' => $this->event_venue,
            'guest_count' => $this->guest_count,
            'special_requests' => $this->special_requests,
            'deposit_amount' => $this->deposit_amount,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
        ];
    }
}
