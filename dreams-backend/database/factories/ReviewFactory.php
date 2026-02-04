<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\Client;
use App\Models\EventPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'package_id' => EventPackage::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'review_message' => $this->faker->paragraph(),
        ];
    }

    public function fivestar(): self
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 5,
        ]);
    }
}
