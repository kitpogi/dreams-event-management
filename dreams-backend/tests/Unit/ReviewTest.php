<?php

namespace Tests\Unit;

use App\Models\Review;
use App\Models\Client;
use App\Models\EventPackage;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    /**
     * Test review creation
     */
    public function test_can_create_review(): void
    {
        $review = Review::factory()->create();

        $this->assertDatabaseHas('reviews', [
            'review_id' => $review->review_id,
        ]);
    }

    /**
     * Test review relationships
     */
    public function test_review_has_client_and_package_relationships(): void
    {
        $client = Client::factory()->create();
        $package = EventPackage::factory()->create();
        $review = Review::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
        ]);

        $this->assertTrue($review->client()->exists());
        $this->assertTrue($review->eventPackage()->exists());
    }

    /**
     * Test review rating range
     */
    public function test_review_rating_is_between_1_and_5(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $review = Review::factory()->create(['rating' => $i]);
            $this->assertBetween($review->rating, 1, 5);
        }
    }

    /**
     * Test five-star review
     */
    public function test_five_star_review(): void
    {
        $review = Review::factory()->fivestar()->create();

        $this->assertEquals(5, $review->rating);
    }

    private function assertBetween($value, $min, $max): void
    {
        $this->assertGreaterThanOrEqual($min, $value);
        $this->assertLessThanOrEqual($max, $value);
    }
}
