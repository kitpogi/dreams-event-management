<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\BookingDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'booking_id' => BookingDetail::factory(),
            'transaction_id' => $this->faker->unique()->sha256(),
            'amount' => $this->faker->numberBetween(10000, 500000),
            'status' => $this->faker->randomElement(['pending', 'processing', 'paid', 'failed', 'refunded']),
            'method' => $this->faker->randomElement(['credit_card', 'debit_card', 'bank_transfer', 'ewallet']),
            'payment_type' => $this->faker->randomElement(['deposit', 'partial', 'full']),
            'reference_number' => $this->faker->unique()->regexify('[A-Z0-9]{10}'),
            'notes' => $this->faker->optional()->sentence(),
            'paid_at' => $this->faker->optional()->dateTime(),
        ];
    }

    public function paid(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function pending(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'paid_at' => null,
        ]);
    }

    public function failed(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'paid_at' => null,
        ]);
    }
}
