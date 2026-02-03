<?php

namespace App\DTOs\Responses;

class ReviewResponseDTO
{
    public function __construct(
        public int $id,
        public int $user_id,
        public int $venue_id,
        public int $rating,
        public string $title,
        public string $comment,
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
            user_id: $model->user_id,
            venue_id: $model->venue_id,
            rating: $model->rating,
            title: $model->title,
            comment: $model->comment,
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
            'user_id' => $this->user_id,
            'venue_id' => $this->venue_id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
