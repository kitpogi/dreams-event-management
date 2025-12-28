<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PreferenceSummaryService;
use App\Models\Client;
use App\Models\EventPreference;
use App\Models\BookingDetail;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PreferenceSummaryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $preferenceSummaryService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->preferenceSummaryService = new PreferenceSummaryService();
    }

    /** @test */
    public function it_generates_summary_for_client_without_preferences()
    {
        $client = Client::factory()->create();

        $summary = $this->preferenceSummaryService->generateSummary($client);

        $this->assertIsArray($summary);
        $this->assertEquals($client->client_id, $summary['client_id']);
        $this->assertNull($summary['stored_preferences']);
        $this->assertIsArray($summary['booking_history_summary']);
        $this->assertEquals(0, $summary['booking_history_summary']['total_bookings']);
    }

    /** @test */
    public function it_includes_stored_preferences_in_summary()
    {
        $client = Client::factory()->create();
        $preference = EventPreference::factory()->create([
            'client_id' => $client->client_id,
            'preferred_event_type' => 'wedding',
            'preferred_budget' => 50000,
            'preferred_theme' => 'elegant',
            'preferred_guest_count' => 100,
            'preferred_venue' => 'Grand Ballroom',
        ]);

        $summary = $this->preferenceSummaryService->generateSummary($client);

        $this->assertNotNull($summary['stored_preferences']);
        $this->assertEquals('wedding', $summary['stored_preferences']['event_type']);
        $this->assertEquals(50000, $summary['stored_preferences']['budget']);
        $this->assertEquals('elegant', $summary['stored_preferences']['theme']);
    }

    /** @test */
    public function it_analyzes_booking_history()
    {
        $client = Client::factory()->create();
        $package1 = EventPackage::factory()->create(['package_category' => 'wedding', 'package_price' => 50000]);
        $package2 = EventPackage::factory()->create(['package_category' => 'wedding', 'package_price' => 60000]);
        $package3 = EventPackage::factory()->create(['package_category' => 'birthday', 'package_price' => 30000]);

        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package1->package_id,
            'event_venue' => 'Venue A',
            'guest_count' => 100,
            'booking_status' => 'Completed',
        ]);
        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package2->package_id,
            'event_venue' => 'Venue A',
            'guest_count' => 150,
            'booking_status' => 'Pending',
        ]);
        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package3->package_id,
            'event_venue' => 'Venue B',
            'guest_count' => 50,
            'booking_status' => 'Completed',
        ]);

        $summary = $this->preferenceSummaryService->generateSummary($client);

        $this->assertEquals(3, $summary['booking_history_summary']['total_bookings']);
        $this->assertEquals(2, $summary['booking_history_summary']['completed_bookings']);
        $this->assertEquals('wedding', $summary['booking_history_summary']['most_booked_category']);
        $this->assertEquals('Venue A', $summary['booking_history_summary']['most_used_venue']);
        $this->assertContains('wedding', $summary['preferred_event_types']);
        $this->assertContains('birthday', $summary['preferred_event_types']);
        $this->assertEquals(46666.67, round($summary['average_budget'], 2)); // (50000 + 60000 + 30000) / 3
        $this->assertEquals(100, $summary['average_guest_count']); // (100 + 150 + 50) / 3
    }

    /** @test */
    public function it_calculates_preferred_venues_from_bookings()
    {
        $client = Client::factory()->create();
        $package = EventPackage::factory()->create();

        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'event_venue' => 'Venue A',
        ]);
        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'event_venue' => 'Venue B',
        ]);
        BookingDetail::factory()->create([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
            'event_venue' => 'Venue A',
        ]);

        $summary = $this->preferenceSummaryService->generateSummary($client);

        $this->assertContains('Venue A', $summary['preferred_venues']);
        $this->assertContains('Venue B', $summary['preferred_venues']);
        $this->assertCount(2, $summary['preferred_venues']);
    }

    /** @test */
    public function it_can_store_client_preferences()
    {
        $client = Client::factory()->create();
        $preferenceData = [
            'type' => 'wedding',
            'budget' => 50000,
            'theme' => 'elegant',
            'guests' => 100,
            'venue' => 'Grand Ballroom',
            'preferences' => ['flowers', 'music'],
        ];

        $preference = $this->preferenceSummaryService->storePreferences($client, $preferenceData, 1);

        $this->assertInstanceOf(EventPreference::class, $preference);
        $this->assertEquals($client->client_id, $preference->client_id);
        $this->assertEquals('wedding', $preference->preferred_event_type);
        $this->assertEquals(50000, $preference->preferred_budget);
        $this->assertEquals('elegant', $preference->preferred_theme);
    }

    /** @test */
    public function it_updates_existing_preferences()
    {
        $client = Client::factory()->create();
        $existingPreference = EventPreference::factory()->create([
            'client_id' => $client->client_id,
            'preferred_event_type' => 'birthday',
        ]);

        $preferenceData = [
            'type' => 'wedding',
            'budget' => 50000,
        ];

        $preference = $this->preferenceSummaryService->storePreferences($client, $preferenceData);

        $this->assertEquals($existingPreference->client_id, $preference->client_id);
        $this->assertEquals('wedding', $preference->preferred_event_type);
        $this->assertEquals(50000, $preference->preferred_budget);
    }
}

