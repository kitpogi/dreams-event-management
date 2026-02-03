<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\BookingDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $issuedDate = $this->faker->dateTimeThisYear();
        
        return [
            'booking_id' => BookingDetail::factory(),
            'invoice_number' => 'INV-' . now()->year . '-' . str_pad($this->faker->unique()->numberBetween(1, 9999), 5, '0', STR_PAD_LEFT),
            'amount' => $this->faker->numberBetween(50000, 1000000),
            'issued_date' => $issuedDate,
            'due_date' => $this->faker->dateTimeBetween($issuedDate, '+30 days'),
            'status' => $this->faker->randomElement(['unpaid', 'partial', 'paid', 'overdue', 'void']),
            'payment_status' => $this->faker->randomElement(['unpaid', 'partial', 'paid']),
            'notes' => $this->faker->optional()->paragraph(),
        ];
    }

    public function paid(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'payment_status' => 'paid',
        ]);
    }

    public function unpaid(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'unpaid',
            'payment_status' => 'unpaid',
        ]);
    }

    public function partial(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'partial',
            'payment_status' => 'partial',
        ]);
    }
}
