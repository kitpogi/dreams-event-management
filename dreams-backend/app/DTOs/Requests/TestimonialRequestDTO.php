<?php

namespace App\DTOs\Requests;

class TestimonialRequestDTO
{
    public function __construct(
        public int $coordinator_id,
        public string $client_name,
        public string $testimonial_text,
        public bool $is_featured = false,
        public ?string $status = 'pending',
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            coordinator_id: (int) $data['coordinator_id'],
            client_name: $data['client_name'],
            testimonial_text: $data['testimonial_text'],
            is_featured: (bool) ($data['is_featured'] ?? false),
            status: $data['status'] ?? 'pending',
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'coordinator_id' => $this->coordinator_id,
            'client_name' => $this->client_name,
            'testimonial_text' => $this->testimonial_text,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
        ];
    }
}
