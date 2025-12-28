<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,

            // Capstone schema seeders
            ClientSeeder::class,
            EventPackageCapstoneSeeder::class,
            BookingDetailSeeder::class,
            RecommendationSeeder::class,
            PortfolioItemSeeder::class,
            TestimonialSeeder::class,
        ]);
    }
}

