<?php

namespace App\DTOs\Responses;

class ContactInquiryResponseDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public string $phone,
        public string $subject,
        public string $message,
        public string $status,
        public bool $is_read,
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
            name: $model->name,
            email: $model->email,
            phone: $model->phone,
            subject: $model->subject,
            message: $model->message,
            status: $model->status,
            is_read: $model->is_read,
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
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'is_read' => $this->is_read,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
