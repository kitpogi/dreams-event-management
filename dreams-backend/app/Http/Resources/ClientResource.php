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
        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'isAdmin') && $user->isAdmin();
        $isCoordinator = $user && method_exists($user, 'isCoordinator') && $user->isCoordinator();
        $isStaff = $isAdmin || $isCoordinator;

        // Base data visible to the client themselves
        $data = [
            'client_id' => $this->client_id,
            'client_fname' => $this->client_fname,
            'client_lname' => $this->client_lname,
            'client_email' => $this->client_email,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        // Contact info visible to staff and client themselves
        if ($isStaff || $this->isOwnProfile($request)) {
            $data['client_contact'] = $this->client_contact;
            $data['client_address'] = $this->client_address;
        }

        // Include bookings count only when needed
        $data['bookings_count'] = $this->when(
            isset($this->bookings_count),
            $this->bookings_count
        );
        
        // Include bookings only when loaded
        $data['bookings'] = $this->whenLoaded('bookings', function () {
            return BookingResource::collection($this->bookings);
        });
        
        // Include reviews only when loaded
        $data['reviews'] = $this->whenLoaded('reviews', function () {
            return $this->reviews->map(function ($review) {
                return [
                    'review_id' => $review->review_id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at?->toISOString(),
                ];
            });
        });
        
        // Include recommendations only when loaded
        $data['recommendations'] = $this->whenLoaded('recommendations', function () {
            return $this->recommendations->map(function ($recommendation) {
                return [
                    'recommendation_id' => $recommendation->recommendation_id,
                    'package_id' => $recommendation->package_id,
                    'score' => round((float) $recommendation->score, 2),
                    'reason' => $recommendation->reason,
                    'created_at' => $recommendation->created_at?->toISOString(),
                ];
            });
        });

        // Admin-only analytics fields
        if ($isAdmin) {
            $data['analytics'] = [
                'total_spent' => $this->when(
                    isset($this->total_spent),
                    round((float) ($this->total_spent ?? 0), 2)
                ),
                'lifetime_value' => $this->when(
                    isset($this->lifetime_value),
                    round((float) ($this->lifetime_value ?? 0), 2)
                ),
                'average_booking_value' => $this->when(
                    isset($this->average_booking_value),
                    round((float) ($this->average_booking_value ?? 0), 2)
                ),
                'first_booking_date' => $this->when(
                    isset($this->first_booking_date),
                    $this->first_booking_date
                ),
                'last_booking_date' => $this->when(
                    isset($this->last_booking_date),
                    $this->last_booking_date
                ),
            ];
        }

        return $data;
    }

    /**
     * Check if the resource represents the authenticated user's own profile.
     */
    protected function isOwnProfile(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        
        return $this->client_email === $user->email;
    }
}
