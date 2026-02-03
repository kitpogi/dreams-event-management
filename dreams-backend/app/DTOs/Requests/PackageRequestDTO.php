<?php

namespace App\DTOs\Requests;

class PackageRequestDTO
{
    public function __construct(
        public string $package_name,
        public string $package_description,
        public string $package_category,
        public float $package_price,
        public int $capacity,
        public ?string $inclusions = null,
        public ?string $exclusions = null,
        public bool $is_featured = false,
        public bool $is_active = true,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            package_name: $data['package_name'],
            package_description: $data['package_description'],
            package_category: $data['package_category'],
            package_price: (float) $data['package_price'],
            capacity: (int) $data['capacity'],
            inclusions: $data['inclusions'] ?? null,
            exclusions: $data['exclusions'] ?? null,
            is_featured: (bool) ($data['is_featured'] ?? false),
            is_active: (bool) ($data['is_active'] ?? true),
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'package_name' => $this->package_name,
            'package_description' => $this->package_description,
            'package_category' => $this->package_category,
            'package_price' => $this->package_price,
            'capacity' => $this->capacity,
            'inclusions' => $this->inclusions,
            'exclusions' => $this->exclusions,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
        ];
    }
}
