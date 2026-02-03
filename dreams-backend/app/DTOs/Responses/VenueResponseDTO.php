<?php

namespace App\DTOs\Responses;

class VenueResponseDTO
{
    public function __construct(
        public int $id,
        public int $coordinator_id,
        public string $venue_name,
        public string $venue_description,
        public string $location,
        public int $capacity,
        public float $rental_price,
        public ?string $amenities,
        public ?string $house_rules,
        public bool $is_featured,
        public bool $is_approved,
        public ?float $average_rating,
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
            venue_name: $model->venue_name,
            venue_description: $model->venue_description,
            location: $model->location,
            capacity: $model->capacity,
            rental_price: $model->rental_price,
            amenities: $model->amenities,
            house_rules: $model->house_rules,
            is_featured: $model->is_featured,
            is_approved: $model->is_approved,
            average_rating: $model->reviews()->avg('rating'),
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
            'venue_name' => $this->venue_name,
            'venue_description' => $this->venue_description,
            'location' => $this->location,
            'capacity' => $this->capacity,
            'rental_price' => $this->rental_price,
            'amenities' => $this->amenities,
            'house_rules' => $this->house_rules,
            'is_featured' => $this->is_featured,
            'is_approved' => $this->is_approved,
            'average_rating' => $this->average_rating,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
