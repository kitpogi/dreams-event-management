<?php

namespace App\DTOs\Requests;

class PaymentRequestDTO
{
    public function __construct(
        public int $booking_id,
        public float $amount,
        public string $payment_method,
        public string $transaction_reference,
        public ?string $notes = null,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            booking_id: (int) $data['booking_id'],
            amount: (float) $data['amount'],
            payment_method: $data['payment_method'],
            transaction_reference: $data['transaction_reference'],
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
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'notes' => $this->notes,
        ];
    }
}
