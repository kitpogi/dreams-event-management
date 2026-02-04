<?php

namespace Tests\Unit;

use App\Models\Client;
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
            'booking_id' => $booking->booking_id,
        ]);
    }

    /**
     * Test booking relationships
     */
    public function test_booking_detail_has_client_relationship(): void
    {
        $client = Client::factory()->create();
        $booking = BookingDetail::factory()->create(['client_id' => $client->client_id]);

        $this->assertTrue($booking->client()->exists());
        $this->assertEquals($client->client_id, $booking->client->client_id);
    }

    /**
     * Test booking status values
     */
    public function test_booking_has_valid_status(): void
    {
        $statuses = ['Pending', 'Approved', 'Completed', 'Cancelled'];

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
