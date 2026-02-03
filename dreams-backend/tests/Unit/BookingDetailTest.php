<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\BookingDetail;
use Tests\TestCase;

class BookingDetailTest extends TestCase
{
    /**
     * Test booking detail creation
     */
    public function test_can_create_booking_detail(): void
    {
        $booking = BookingDetail::factory()->create();

        $this->assertDatabaseHas('booking_details', [
            'id' => $booking->id,
        ]);
    }

    /**
     * Test booking relationships
     */
    public function test_booking_detail_has_user_relationship(): void
    {
        $user = User::factory()->create();
        $booking = BookingDetail::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($booking->user()->exists());
        $this->assertEquals($user->id, $booking->user->id);
    }

    /**
     * Test booking status values
     */
    public function test_booking_has_valid_status(): void
    {
        $statuses = ['pending', 'approved', 'confirmed', 'completed', 'cancelled'];

        foreach ($statuses as $status) {
            $booking = BookingDetail::factory()->create(['booking_status' => $status]);
            $this->assertEquals($status, $booking->booking_status);
        }
    }

    /**
     * Test booking date validation
     */
    public function test_booking_event_date_is_in_future(): void
    {
        $futureDate = now()->addDays(30);
        $booking = BookingDetail::factory()->create(['event_date' => $futureDate]);

        $this->assertTrue($booking->event_date->isFuture());
    }
}
