<?php

namespace Database\Seeders;

use App\Models\Venue;
use Illuminate\Database\Seeder;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $venues = [
            [
                'name' => 'Grand Ballroom',
                'location' => 'Manila, Philippines',
                'capacity' => 500,
                'description' => 'Elegant ballroom perfect for grand celebrations with state-of-the-art facilities.',
            ],
            [
                'name' => 'Garden Pavilion',
                'location' => 'Makati, Philippines',
                'capacity' => 300,
                'description' => 'Beautiful outdoor venue surrounded by lush gardens, ideal for intimate gatherings.',
            ],
            [
                'name' => 'Skyline Events Center',
                'location' => 'Quezon City, Philippines',
                'capacity' => 200,
                'description' => 'Modern event center with panoramic city views and contemporary amenities.',
            ],
        ];

        foreach ($venues as $venue) {
            Venue::create($venue);
        }
    }
}

