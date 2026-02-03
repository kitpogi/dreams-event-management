<?php

namespace Database\Factories;

use App\Models\ContactInquiry;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactInquiryFactory extends Factory
{
    protected $model = ContactInquiry::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'event_type' => $this->faker->randomElement(['wedding', 'birthday', 'corporate', 'anniversary', 'debut', 'pageant', 'other']),
            'date_of_event' => $this->faker->dateTimeBetween('+1 month', '+6 months'),
            'preferred_venue' => $this->faker->word(),
            'estimated_guests' => $this->faker->numberBetween(50, 500),
            'budget' => $this->faker->numberBetween(50000, 1000000),
            'message' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['new', 'replied', 'archived']),
            'is_old' => false,
        ];
    }

    public function replied(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'replied',
        ]);
    }

    public function archived(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'archived',
        ]);
    }
}
