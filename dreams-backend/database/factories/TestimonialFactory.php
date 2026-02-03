<?php

namespace Database\Factories;

use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TestimonialFactory extends Factory
{
    protected $model = Testimonial::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->safeEmail(),
            'message' => $this->faker->paragraph(),
            'rating' => $this->faker->numberBetween(4, 5),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'is_featured' => $this->faker->boolean(20),
            'event_type' => $this->faker->randomElement(['wedding', 'birthday', 'corporate', 'anniversary', 'debut']),
            'event_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
        ];
    }

    public function approved(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function featured(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'is_featured' => true,
        ]);
    }
}
