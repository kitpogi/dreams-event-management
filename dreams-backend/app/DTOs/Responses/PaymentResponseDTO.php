<?php

namespace App\DTOs\Responses;

class PaymentResponseDTO
{
    public function __construct(
        public int $id,
        public int $user_id,
        public int $booking_id,
        public float $amount,
        public string $payment_method,
        public string $transaction_reference,
        public string $status,
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
            booking_id: $model->booking_id,
            amount: $model->amount,
            payment_method: $model->payment_method,
            transaction_reference: $model->transaction_reference,
            status: $model->status,
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
            'booking_id' => $this->booking_id,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
