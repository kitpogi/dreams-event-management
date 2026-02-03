<?php

namespace App\DTOs\Requests;

class VenueRequestDTO
{
    public function __construct(
        public string $venue_name,
        public string $venue_description,
        public string $location,
        public int $capacity,
        public float $rental_price,
        public ?string $amenities = null,
        public ?string $house_rules = null,
        public bool $is_featured = false,
        public bool $is_approved = false,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            venue_name: $data['venue_name'],
            venue_description: $data['venue_description'],
            location: $data['location'],
            capacity: (int) $data['capacity'],
            rental_price: (float) $data['rental_price'],
            amenities: $data['amenities'] ?? null,
            house_rules: $data['house_rules'] ?? null,
            is_featured: (bool) ($data['is_featured'] ?? false),
            is_approved: (bool) ($data['is_approved'] ?? false),
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'venue_name' => $this->venue_name,
            'venue_description' => $this->venue_description,
            'location' => $this->location,
            'capacity' => $this->capacity,
            'rental_price' => $this->rental_price,
            'amenities' => $this->amenities,
            'house_rules' => $this->house_rules,
            'is_featured' => $this->is_featured,
            'is_approved' => $this->is_approved,
        ];
    }
}
