<?php

namespace Tests\Feature;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_booking()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create(['capacity' => 200]); // Ensure capacity is high enough
        // Client will be created automatically by ClientService::findOrCreateFromUser

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/bookings', [
                'package_id' => $package->package_id,
                'event_date' => now()->addDays(30)->format('Y-m-d'),
                'event_venue' => 'Test Venue',
                'event_time' => '18:00',
                'guest_count' => 100,
                'special_requests' => 'Vegetarian options needed',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'booking_id',
                    'package_id',
                    'event_date',
                    'booking_status',
                ],
            ]);

        $this->assertDatabaseHas('booking_details', [
            'package_id' => $package->package_id,
            'event_venue' => 'Test Venue',
        ]);
    }

    public function test_user_cannot_create_booking_with_past_date()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/bookings', [
                'package_id' => $package->package_id,
                'event_date' => now()->subDays(1)->format('Y-m-d'),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date']);
    }

    public function test_user_can_view_own_bookings()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $client = Client::factory()->create(['client_email' => $user->email]);
        $package = EventPackage::factory()->create();

        BookingDetail::factory()->count(3)->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/bookings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'booking_id',
                        'event_date',
                        'booking_status',
                    ],
                ],
                'meta',
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_view_all_bookings()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create();

        BookingDetail::factory()->count(5)->create([
            'package_id' => $package->package_id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/bookings');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_can_update_booking_status()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test-token')->plainTextToken;
        $booking = BookingDetail::factory()->create(['booking_status' => 'Pending']);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/bookings/status/{$booking->booking_id}", [
                'status' => 'Approved',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('booking_details', [
            'booking_id' => $booking->booking_id,
            'booking_status' => 'Approved',
        ]);
    }

    public function test_non_admin_cannot_update_booking_status()
    {
        $client = User::factory()->create();
        $token = $client->createToken('test-token')->plainTextToken;
        $booking = BookingDetail::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/bookings/status/{$booking->booking_id}", [
                'status' => 'Approved',
            ]);

        $response->assertStatus(403);
    }

    public function test_user_can_check_availability()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create();
        $checkDate = now()->addDays(30)->format('Y-m-d');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/bookings/check-availability?package_id={$package->package_id}&event_date={$checkDate}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'available',
                'date',
                'package_id',
            ]);
    }
}

