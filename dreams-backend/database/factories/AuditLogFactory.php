<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'action' => $this->faker->randomElement(['created', 'updated', 'deleted', 'viewed', 'exported', 'imported']),
            'model_type' => $this->faker->randomElement(['Booking', 'Package', 'Review', 'Payment', 'User', 'ContactInquiry']),
            'model_id' => $this->faker->numberBetween(1, 1000),
            'old_values' => $this->faker->optional()->word(),
            'new_values' => $this->faker->optional()->word(),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'description' => $this->faker->sentence(),
        ];
    }

    public function created(): self
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'created',
        ]);
    }

    public function deleted(): self
    {
        return $this->state(fn (array $attributes) => [
            'action' => 'deleted',
        ]);
    }
}
