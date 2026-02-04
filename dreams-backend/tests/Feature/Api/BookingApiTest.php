<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Client;
use App\Models\BookingDetail;
use App\Models\EventPackage;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    /**
     * Test user can retrieve their bookings
     */
    public function test_user_can_retrieve_their_bookings(): void
    {
        $user = $this->authenticateUser();
        
        // Create a client associated with this user's email
        $client = Client::factory()->create([
            'client_email' => $user->email,
        ]);
        
        BookingDetail::factory()->count(3)->create(['client_id' => $client->client_id]);

        $response = $this->jsonApi(
            'GET',
            '/api/bookings',
            [],
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
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
        $package = EventPackage::factory()->create();

        $bookingData = [
            'package_id' => $package->package_id,
            'event_date' => now()->addMonth()->format('Y-m-d'),
            'event_time' => '10:00',
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
                    'booking_id',
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
        
        // Create a client associated with this user's email
        $client = Client::factory()->create([
            'client_email' => $user->email,
        ]);
        
        $booking = BookingDetail::factory()->create(['client_id' => $client->client_id]);

        $response = $this->jsonApi(
            'GET',
            "/api/bookings/{$booking->booking_id}",
            [],
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'booking_id',
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
        
        // Create another client (different from user1)
        $client2 = Client::factory()->create();
        $booking = BookingDetail::factory()->create(['client_id' => $client2->client_id]);

        $response = $this->jsonApi(
            'GET',
            "/api/bookings/{$booking->booking_id}",
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
        
        // Create a client associated with this user's email
        $client = Client::factory()->create([
            'client_email' => $user->email,
        ]);
        
        $booking = BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'booking_status' => 'Pending',
        ]);

        $updateData = [
            'event_venue' => 'Updated Venue',
            'guest_count' => 150,
        ];

        $response = $this->jsonApi(
            'PATCH',
            "/api/bookings/{$booking->booking_id}",
            $updateData,
            $this->getAuthHeader($user)
        );

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'message', 'data']);

        $this->assertDatabaseHas('booking_details', [
            'booking_id' => $booking->booking_id,
            'event_venue' => 'Updated Venue',
        ]);
    }
}
