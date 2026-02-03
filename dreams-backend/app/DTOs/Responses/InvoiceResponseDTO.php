<?php

namespace App\DTOs\Responses;

class InvoiceResponseDTO
{
    public function __construct(
        public int $id,
        public int $booking_id,
        public int $user_id,
        public string $invoice_number,
        public float $total_amount,
        public string $client_name,
        public string $client_email,
        public ?string $client_phone,
        public string $status,
        public ?string $due_date,
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
            booking_id: $model->booking_id,
            user_id: $model->user_id,
            invoice_number: $model->invoice_number,
            total_amount: $model->total_amount,
            client_name: $model->client_name,
            client_email: $model->client_email,
            client_phone: $model->client_phone,
            status: $model->status,
            due_date: $model->due_date?->toDateString(),
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
            'booking_id' => $this->booking_id,
            'user_id' => $this->user_id,
            'invoice_number' => $this->invoice_number,
            'total_amount' => $this->total_amount,
            'client_name' => $this->client_name,
            'client_email' => $this->client_email,
            'client_phone' => $this->client_phone,
            'status' => $this->status,
            'due_date' => $this->due_date,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
