<?php

namespace App\DTOs\Responses;

class TestimonialResponseDTO
{
    public function __construct(
        public int $id,
        public int $coordinator_id,
        public ?int $client_id,
        public string $client_name,
        public string $testimonial_text,
        public bool $is_featured,
        public string $status,
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
            coordinator_id: $model->coordinator_id,
            client_id: $model->client_id,
            client_name: $model->client_name,
            testimonial_text: $model->testimonial_text,
            is_featured: $model->is_featured,
            status: $model->status,
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
            'coordinator_id' => $this->coordinator_id,
            'client_id' => $this->client_id,
            'client_name' => $this->client_name,
            'testimonial_text' => $this->testimonial_text,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
