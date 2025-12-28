<?php

namespace Database\Factories;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BookingDetail>
 */
class BookingDetailFactory extends Factory
{
    protected $model = BookingDetail::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'package_id' => EventPackage::factory(),
            'event_date' => fake()->dateTimeBetween('+1 week', '+3 months'),
            'event_time' => fake()->time('H:i'),
            'event_venue' => fake()->address(),
            'guest_count' => fake()->numberBetween(10, 500),
            'booking_status' => fake()->randomElement(['Pending', 'Approved', 'Cancelled']),
            'special_requests' => fake()->optional()->sentence(),
            'internal_notes' => null,
        ];
    }

    /**
     * Indicate that the booking is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => 'Pending',
        ]);
    }

    /**
     * Indicate that the booking is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => 'Approved',
        ]);
    }
}

