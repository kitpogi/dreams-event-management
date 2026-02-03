<?php

namespace Database\Factories;

use App\Models\RecommendationLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecommendationLogFactory extends Factory
{
    protected $model = RecommendationLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'recommendation_data' => json_encode([
                'budget' => $this->faker->numberBetween(50000, 1000000),
                'event_type' => $this->faker->word(),
                'guests' => $this->faker->numberBetween(50, 500),
            ]),
            'recommendations_generated' => json_encode([
                ['package_id' => rand(1, 50), 'score' => $this->faker->randomFloat(2, 0.5, 1)],
                ['package_id' => rand(1, 50), 'score' => $this->faker->randomFloat(2, 0.5, 1)],
            ]),
            'feedback' => $this->faker->optional()->randomElement(['helpful', 'not_helpful']),
        ];
    }
}
