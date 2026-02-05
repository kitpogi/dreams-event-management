<?php

namespace Tests\Integration;

use App\Models\User;
use App\Models\Client;
use App\Models\EventPackage;
use App\Models\BookingDetail;
use App\Models\Venue;

class BookingWorkflowTest extends IntegrationTestCase
{
    /** @test */
    public function complete_booking_workflow()
    {
        // 1. Create a user and authenticate
        /** @var User $user */
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user);

        // 2. Create a client for the user
        $client = Client::factory()->create([
            'client_email' => $user->email,
        ]);

        // 3. Create a venue and package
        $venue = Venue::factory()->create();
        $package = EventPackage::factory()->create([
            'venue_id' => $venue->venue_id,
        ]);

        // 4. Create a booking (event_venue is a text field, not a FK)
        $booking = BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'booking_status' => 'Pending',
        ]);

        // 5. Assert the booking was created correctly
        $this->assertDatabaseHas('booking_details', [
            'booking_id' => $booking->booking_id,
            'client_id' => $client->client_id,
            'booking_status' => 'Pending',
        ]);

        // 6. Verify relationships work
        $this->assertEquals($client->client_id, $booking->client->client_id);
        $this->assertEquals($package->package_id, $booking->eventPackage->package_id);
    }

    /** @test */
    public function booking_status_can_be_updated()
    {
        $client = Client::factory()->create();
        $package = EventPackage::factory()->create();
        
        $booking = BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'booking_status' => 'Pending',
        ]);

        // Update status
        $booking->booking_status = 'Approved';
        $booking->save();

        $this->assertDatabaseHas('booking_details', [
            'booking_id' => $booking->booking_id,
            'booking_status' => 'Approved',
        ]);
    }

    /** @test */
    public function client_can_have_multiple_bookings()
    {
        $client = Client::factory()->create();
        
        // Create 3 bookings for the same client
        for ($i = 0; $i < 3; $i++) {
            $package = EventPackage::factory()->create();
            BookingDetail::factory()->create([
                'client_id' => $client->client_id,
                'package_id' => $package->package_id,
            ]);
        }

        // Verify client has 3 bookings
        $this->assertCount(3, BookingDetail::where('client_id', $client->client_id)->get());
    }

    /** @test */
    public function package_can_have_multiple_bookings()
    {
        $package = EventPackage::factory()->create();

        // Create bookings from different clients
        for ($i = 0; $i < 3; $i++) {
            $client = Client::factory()->create();
            BookingDetail::factory()->create([
                'client_id' => $client->client_id,
                'package_id' => $package->package_id,
            ]);
        }

        // Verify package has 3 bookings
        $this->assertCount(3, BookingDetail::where('package_id', $package->package_id)->get());
    }

    /** @test */
    public function booking_with_future_date_is_valid()
    {
        $futureDate = now()->addDays(30)->format('Y-m-d');
        
        $client = Client::factory()->create();
        $package = EventPackage::factory()->create();
        
        $booking = BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'event_date' => $futureDate,
        ]);

        $this->assertTrue($booking->event_date >= now()->format('Y-m-d'));
    }

    /** @test */
    public function user_roles_are_properly_set()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coordinator = User::factory()->create(['role' => 'coordinator']);
        $user = User::factory()->create(['role' => 'user']);

        $this->assertEquals('admin', $admin->role);
        $this->assertEquals('coordinator', $coordinator->role);
        $this->assertEquals('user', $user->role);
    }

    /** @test */
    public function event_package_has_correct_attributes()
    {
        $package = EventPackage::factory()->create([
            'package_name' => 'Premium Wedding Package',
            'package_price' => 50000,
            'package_category' => 'Wedding',
        ]);

        $this->assertEquals('Premium Wedding Package', $package->package_name);
        $this->assertEquals(50000, $package->package_price);
        $this->assertEquals('Wedding', $package->package_category);
    }

    /** @test */
    public function venue_can_have_multiple_packages()
    {
        $venue = Venue::factory()->create();

        EventPackage::factory()->count(3)->create([
            'venue_id' => $venue->venue_id,
        ]);

        $packages = EventPackage::where('venue_id', $venue->venue_id)->get();
        $this->assertCount(3, $packages);
    }
}
