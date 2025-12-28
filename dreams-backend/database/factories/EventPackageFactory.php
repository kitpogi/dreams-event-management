<?php

namespace Database\Factories;

use App\Models\EventPackage;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventPackage>
 */
class EventPackageFactory extends Factory
{
    protected $model = EventPackage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'package_name' => fake()->words(3, true) . ' Package',
            'package_description' => fake()->paragraph(),
            'package_category' => fake()->randomElement(['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Graduation']),
            'package_price' => fake()->numberBetween(1000, 10000),
            'capacity' => fake()->numberBetween(50, 500),
            'venue_id' => Venue::factory(),
            'package_image' => 'packages/default.jpg',
            'package_inclusions' => fake()->sentence(),
        ];
    }
}

