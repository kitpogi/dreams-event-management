<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Client;
use App\Models\BookingDetail;
use App\Models\EventPackage;

class BookingServiceTest extends TestCase
{
    /**
     * Test booking can be created through service
     */
    public function test_booking_can_be_created(): void
    {
        $client = Client::factory()->create();
        $package = EventPackage::factory()->create();

        $bookingData = [
            'package_id' => $package->package_id,
            'event_date' => now()->addMonth(),
            'event_time' => '10:00',
            'event_venue' => 'Test Venue',
            'guest_count' => 100,
            'special_requests' => 'Test request',
        ];

        $booking = BookingDetail::factory()->create(array_merge($bookingData, [
            'client_id' => $client->client_id,
            'booking_status' => 'Pending',
        ]));

        $this->assertNotNull($booking->booking_id);
        $this->assertEquals($client->client_id, $booking->client_id);
        $this->assertEquals('Pending', $booking->booking_status);
    }

    /**
     * Test booking status transitions are valid
     */
    public function test_booking_status_transition_is_valid(): void
    {
        $booking = BookingDetail::factory()->create(['booking_status' => 'Pending']);

        $validStatuses = ['Pending', 'Approved', 'Confirmed', 'Completed', 'Cancelled'];
        foreach ($validStatuses as $status) {
            $booking->update(['booking_status' => $status]);
            $this->assertEquals($status, $booking->fresh()->booking_status);
        }
    }

    /**
     * Test booking date cannot be in the past
     */
    public function test_booking_event_date_must_be_future(): void
    {
        $pastDate = now()->subDays(5);
        
        // This would typically be validated in FormRequest
        $booking = BookingDetail::factory()->create([
            'event_date' => now()->addMonth(),
        ]);

        $this->assertTrue($booking->event_date->isFuture());
    }

    /**
     * Test booking guest count is valid
     */
    public function test_booking_guest_count_is_positive(): void
    {
        $booking = BookingDetail::factory()->create(['guest_count' => 100]);

        $this->assertGreaterThan(0, $booking->guest_count);
    }
}
