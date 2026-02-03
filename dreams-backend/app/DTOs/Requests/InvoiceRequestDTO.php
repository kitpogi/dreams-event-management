<?php

namespace App\DTOs\Requests;

class InvoiceRequestDTO
{
    public function __construct(
        public int $booking_id,
        public int $user_id,
        public float $total_amount,
        public string $client_name,
        public string $client_email,
        public ?string $client_phone = null,
        public ?string $notes = null,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            booking_id: (int) $data['booking_id'],
            user_id: (int) $data['user_id'],
            total_amount: (float) $data['total_amount'],
            client_name: $data['client_name'],
            client_email: $data['client_email'],
            client_phone: $data['client_phone'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'booking_id' => $this->booking_id,
            'user_id' => $this->user_id,
            'total_amount' => $this->total_amount,
            'client_name' => $this->client_name,
            'client_email' => $this->client_email,
            'client_phone' => $this->client_phone,
            'notes' => $this->notes,
        ];
    }
}
