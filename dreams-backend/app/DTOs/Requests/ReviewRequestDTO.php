<?php

namespace App\DTOs\Requests;

class ReviewRequestDTO
{
    public function __construct(
        public int $venue_id,
        public int $rating,
        public string $title,
        public string $comment,
        public bool $is_featured = false,
        public ?string $status = 'pending',
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            venue_id: (int) $data['venue_id'],
            rating: (int) $data['rating'],
            title: $data['title'],
            comment: $data['comment'],
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
            'venue_id' => $this->venue_id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
        ];
    }
}
