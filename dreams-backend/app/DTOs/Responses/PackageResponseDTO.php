<?php

namespace App\DTOs\Responses;

class PackageResponseDTO
{
    public function __construct(
        public int $id,
        public string $package_name,
        public string $package_description,
        public string $package_category,
        public float $package_price,
        public int $capacity,
        public ?string $inclusions,
        public ?string $exclusions,
        public bool $is_featured,
        public bool $is_active,
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
            package_name: $model->package_name,
            package_description: $model->package_description,
            package_category: $model->package_category,
            package_price: $model->package_price,
            capacity: $model->capacity,
            inclusions: $model->inclusions,
            exclusions: $model->exclusions,
            is_featured: $model->is_featured,
            is_active: $model->is_active,
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
            'package_name' => $this->package_name,
            'package_description' => $this->package_description,
            'package_category' => $this->package_category,
            'package_price' => $this->package_price,
            'capacity' => $this->capacity,
            'inclusions' => $this->inclusions,
            'exclusions' => $this->exclusions,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
