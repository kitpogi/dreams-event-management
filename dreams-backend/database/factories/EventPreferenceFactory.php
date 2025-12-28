<?php

namespace Database\Factories;

use App\Models\EventPreference;
use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventPreference>
 */
class EventPreferenceFactory extends Factory
{
    protected $model = EventPreference::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'user_id' => null,
            'preferred_event_type' => fake()->randomElement(['wedding', 'birthday', 'debut', 'corporate', 'anniversary']),
            'preferred_budget' => fake()->numberBetween(10000, 100000),
            'preferred_theme' => fake()->randomElement(['elegant', 'casual', 'modern', 'vintage', 'rustic']),
            'preferred_guest_count' => fake()->numberBetween(50, 500),
            'preferred_venue' => fake()->company() . ' Hall',
            'preferences' => [
                fake()->word(),
                fake()->word(),
            ],
        ];
    }
}

