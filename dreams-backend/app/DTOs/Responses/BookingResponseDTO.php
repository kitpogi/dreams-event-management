<?php

namespace App\DTOs\Responses;

class BookingResponseDTO
{
    public function __construct(
        public int $id,
        public int $user_id,
        public int $package_id,
        public string $event_date,
        public string $event_time,
        public string $event_venue,
        public int $guest_count,
        public string $special_requests,
        public string $booking_status,
        public ?float $deposit_amount,
        public ?string $payment_method,
        public ?string $notes,
        public string $created_at,
        public string $updated_at,
    ) {}

    /**
     * Create DTO from model
     */
    public static function fromModel($model): self
    {
        return new self(
            id: $model->id,
            user_id: $model->user_id,
            package_id: $model->package_id,
            event_date: $model->event_date,
            event_time: $model->event_time,
            event_venue: $model->event_venue,
            guest_count: $model->guest_count,
            special_requests: $model->special_requests,
            booking_status: $model->booking_status,
            deposit_amount: $model->deposit_amount,
            payment_method: $model->payment_method,
            notes: $model->notes,
            created_at: $model->created_at->toIso8601String(),
            updated_at: $model->updated_at->toIso8601String(),
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'package_id' => $this->package_id,
            'event_date' => $this->event_date,
            'event_time' => $this->event_time,
            'event_venue' => $this->event_venue,
            'guest_count' => $this->guest_count,
            'special_requests' => $this->special_requests,
            'booking_status' => $this->booking_status,
            'deposit_amount' => $this->deposit_amount,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
