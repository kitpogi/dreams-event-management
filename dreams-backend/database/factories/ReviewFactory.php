<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\BookingDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'booking_id' => BookingDetail::factory(),
            'user_id' => User::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'is_featured' => $this->faker->boolean(20),
            'is_verified' => $this->faker->boolean(80),
            'helpful_count' => $this->faker->numberBetween(0, 100),
            'unhelpful_count' => $this->faker->numberBetween(0, 20),
        ];
    }

    public function fivestar(): self
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 5,
        ]);
    }

    public function featured(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
            'is_verified' => true,
        ]);
    }
}
