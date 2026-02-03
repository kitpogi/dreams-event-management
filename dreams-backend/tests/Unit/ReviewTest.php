<?php

namespace Tests\Unit;

use App\Models\Review;
use App\Models\User;
use App\Models\BookingDetail;
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
            'id' => $review->id,
        ]);
    }

    /**
     * Test review relationships
     */
    public function test_review_has_user_and_booking_relationships(): void
    {
        $user = User::factory()->create();
        $booking = BookingDetail::factory()->create();
        $review = Review::factory()->create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
        ]);

        $this->assertEquals($user->id, $review->user->id);
        $this->assertEquals($booking->id, $review->booking->id);
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
     * Test featured reviews
     */
    public function test_can_create_featured_review(): void
    {
        $review = Review::factory()->featured()->create();

        $this->assertTrue($review->is_featured);
        $this->assertTrue($review->is_verified);
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
