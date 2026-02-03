<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\BookingResource;

class ClientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'client_id' => $this->client_id,
            'client_fname' => $this->client_fname,
            'client_lname' => $this->client_lname,
            'client_email' => $this->client_email,
            'client_contact' => $this->client_contact,
            'client_address' => $this->client_address,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include bookings count only when needed
            'bookings_count' => $this->when(
                isset($this->bookings_count),
                $this->bookings_count
            ),
            
            // Include bookings only when loaded
            'bookings' => $this->whenLoaded('bookings', function () {
                return BookingResource::collection($this->bookings);
            }),
            
            // Include reviews only when loaded
            'reviews' => $this->whenLoaded('reviews', function () {
                return $this->reviews->map(function ($review) {
                    return [
                        'review_id' => $review->review_id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'created_at' => $review->created_at?->toISOString(),
                    ];
                });
            }),
            
            // Include recommendations only when loaded
            'recommendations' => $this->whenLoaded('recommendations', function () {
                return $this->recommendations->map(function ($recommendation) {
                    return [
                        'recommendation_id' => $recommendation->recommendation_id,
                        'package_id' => $recommendation->package_id,
                        'score' => round((float) $recommendation->score, 2),
                        'reason' => $recommendation->reason,
                        'created_at' => $recommendation->created_at?->toISOString(),
                    ];
                });
            }),
        ];
    }
}
