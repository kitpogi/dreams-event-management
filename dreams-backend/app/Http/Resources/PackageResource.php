<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'package_id' => $this->package_id,
            'package_name' => $this->package_name,
            'package_description' => $this->package_description,
            'package_price' => round((float) $this->package_price, 2),
            'package_category' => $this->package_category,
            'package_image' => $this->package_image,
            'capacity' => $this->capacity,
            'is_featured' => $this->is_featured ?? false,
            'is_available' => $this->is_available ?? true,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include venue only when loaded
            'venue' => $this->whenLoaded('venue', function () {
                return [
                    'venue_id' => $this->venue->venue_id,
                    'name' => $this->venue->name,
                    'location' => $this->venue->location,
                ];
            }),
        ];
    }
}
