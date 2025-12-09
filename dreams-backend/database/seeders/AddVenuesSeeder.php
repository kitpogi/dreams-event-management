<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Venue;

class AddVenuesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $venues = [
            [
                'name' => 'Lalimar',
                'location' => 'Metro Manila',
                'capacity' => 200,
                'description' => 'Elegant event venue perfect for special occasions',
            ],
            [
                'name' => 'The Barn',
                'location' => 'Metro Manila',
                'capacity' => 150,
                'description' => 'Rustic and charming venue with a warm atmosphere',
            ],
        ];

        foreach ($venues as $venueData) {
            Venue::firstOrCreate(
                ['name' => $venueData['name']],
                $venueData
            );
        }
    }
}
