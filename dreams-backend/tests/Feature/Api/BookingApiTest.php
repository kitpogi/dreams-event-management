<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\BookingDetail;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    /**
     * Test user can retrieve their bookings
     */
    public function test_user_can_retrieve_their_bookings(): void
    {
        $user = $this->authenticateUser();
        BookingDetail::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->jsonApi(
            'GET',
            '/api/bookings',
            [],
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [],
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                ],
            ]);
    }

    /**
     * Test user can create a booking
     */
    public function test_user_can_create_booking(): void
    {
        $user = $this->authenticateUser();

        $bookingData = [
            'package_id' => 1,
            'event_date' => now()->addMonth()->format('Y-m-d'),
            'event_time' => '10:00 AM',
            'event_venue' => 'Test Venue',
            'guest_count' => 100,
            'special_requests' => 'Test request',
        ];

        $response = $this->jsonApi(
            'POST',
            '/api/bookings',
            $bookingData,
            $this->getAuthHeader($user)
        );

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'booking_status',
                    'event_date',
                ],
            ]);
    }

    /**
     * Test user cannot create booking with invalid data
     */
    public function test_user_cannot_create_booking_with_invalid_data(): void
    {
        $user = $this->authenticateUser();

        $response = $this->jsonApi(
            'POST',
            '/api/bookings',
            [],
            $this->getAuthHeader($user)
        );

        $response->assertStatus(422)
            ->assertJsonStructure(['success', 'message', 'errors']);
    }

    /**
     * Test user can view a booking
     */
    public function test_user_can_view_their_booking(): void
    {
        $user = $this->authenticateUser();
        $booking = BookingDetail::factory()->create(['user_id' => $user->id]);

        $response = $this->jsonApi(
            'GET',
            "/api/bookings/{$booking->id}",
            [],
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'booking_status',
                    'event_date',
                ],
            ]);
    }

    /**
     * Test user cannot view other user's booking
     */
    public function test_user_cannot_view_other_user_booking(): void
    {
        $user1 = $this->authenticateUser();
        $user2 = User::factory()->create();
        $booking = BookingDetail::factory()->create(['user_id' => $user2->id]);

        $response = $this->jsonApi(
            'GET',
            "/api/bookings/{$booking->id}",
            [],
            $this->getAuthHeader($user1)
        );

        $response->assertStatus(403);
    }

    /**
     * Test user can update their booking
     */
    public function test_user_can_update_their_booking(): void
    {
        $user = $this->authenticateUser();
        $booking = BookingDetail::factory()->create([
            'user_id' => $user->id,
            'booking_status' => 'pending',
        ]);

        $updateData = [
            'event_venue' => 'Updated Venue',
            'guest_count' => 150,
        ];

        $response = $this->jsonApi(
            'PUT',
            "/api/bookings/{$booking->id}",
            $updateData,
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'message', 'data']);

        $this->assertDatabaseHas('booking_details', [
            'id' => $booking->id,
            'event_venue' => 'Updated Venue',
        ]);
    }
}
