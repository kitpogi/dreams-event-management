<?php

namespace Database\Factories;

use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecommendationFactory extends Factory
{
    protected $model = Recommendation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'recommended_packages' => json_encode([
                ['package_id' => rand(1, 50), 'score' => $this->faker->randomFloat(2, 0.5, 1)],
                ['package_id' => rand(1, 50), 'score' => $this->faker->randomFloat(2, 0.5, 1)],
                ['package_id' => rand(1, 50), 'score' => $this->faker->randomFloat(2, 0.5, 1)],
            ]),
            'matching_criteria' => json_encode([
                'budget' => $this->faker->numberBetween(50000, 1000000),
                'event_type' => $this->faker->word(),
                'guests' => $this->faker->numberBetween(50, 500),
            ]),
        ];
    }
}
