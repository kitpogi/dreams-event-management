<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    protected $model = Client::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_fname' => fake()->firstName(),
            'client_lname' => fake()->lastName(),
            'client_mname' => fake()->optional()->firstName(),
            'client_email' => fake()->unique()->safeEmail(),
            'client_contact' => fake()->phoneNumber(),
            'client_address' => fake()->address(),
            'client_password' => Hash::make('password123'),
        ];
    }
}

