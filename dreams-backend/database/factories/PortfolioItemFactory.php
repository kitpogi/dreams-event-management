<?php

namespace Database\Factories;

use App\Models\PortfolioItem;
use App\Models\EventPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

class PortfolioItemFactory extends Factory
{
    protected $model = PortfolioItem::class;

    public function definition(): array
    {
        return [
            'package_id' => EventPackage::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'image_url' => $this->faker->imageUrl(400, 300, 'events'),
            'category' => $this->faker->randomElement(['wedding', 'birthday', 'corporate', 'anniversary', 'debut']),
            'event_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'location' => $this->faker->city(),
            'display_order' => $this->faker->numberBetween(1, 50),
            'is_featured' => $this->faker->boolean(30),
        ];
    }

    public function featured(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
