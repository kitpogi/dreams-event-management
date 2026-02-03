<?php

namespace Database\Factories;

use App\Models\BookingReminder;
use App\Models\BookingDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingReminderFactory extends Factory
{
    protected $model = BookingReminder::class;

    public function definition(): array
    {
        return [
            'booking_id' => BookingDetail::factory(),
            'reminder_type' => $this->faker->randomElement(['event', 'payment', 'custom']),
            'reminder_date' => $this->faker->dateTimeBetween('+1 day', '+30 days'),
            'message' => $this->faker->paragraph(),
            'is_sent' => $this->faker->boolean(50),
            'sent_at' => $this->faker->optional(50)->dateTime(),
        ];
    }

    public function sent(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_sent' => true,
            'sent_at' => now(),
        ]);
    }

    public function unsent(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_sent' => false,
            'sent_at' => null,
        ]);
    }
}
