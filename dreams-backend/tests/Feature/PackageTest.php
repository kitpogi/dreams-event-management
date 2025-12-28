<?php

namespace Tests\Feature;

use App\Models\EventPackage;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PackageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_public_can_view_packages()
    {
        EventPackage::factory()->count(3)->create();

        $response = $this->getJson('/api/packages');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'package_id',
                        'package_name',
                        'package_price',
                    ],
                ],
                'meta',
            ]);
    }

    public function test_public_can_view_single_package()
    {
        $package = EventPackage::factory()->create();

        $response = $this->getJson("/api/packages/{$package->package_id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'package_id',
                    'package_name',
                    'package_description',
                    'package_price',
                ],
            ]);
    }

    public function test_admin_can_create_package()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test-token')->plainTextToken;
        $venue = Venue::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/packages', [
                'package_name' => 'Test Package',
                'package_description' => 'Test Description',
                'package_category' => 'Wedding',
                'package_price' => 5000.00,
                'capacity' => 100,
                'venue_id' => $venue->id,
                'package_inclusions' => 'Food, Music, Decorations',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'package_id',
                    'package_name',
                    'package_price',
                ],
            ]);

        $this->assertDatabaseHas('event_packages', [
            'package_name' => 'Test Package',
            'package_price' => 5000.00,
        ]);
    }

    public function test_admin_can_update_package()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/packages/{$package->package_id}", [
                'package_name' => 'Updated Package Name',
                'package_price' => 6000.00,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('event_packages', [
            'package_id' => $package->package_id,
            'package_name' => 'Updated Package Name',
            'package_price' => 6000.00,
        ]);
    }

    public function test_admin_can_delete_package()
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test-token')->plainTextToken;
        $package = EventPackage::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/packages/{$package->package_id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('event_packages', [
            'package_id' => $package->package_id,
        ]);
    }

    public function test_non_admin_cannot_create_package()
    {
        $client = User::factory()->create();
        $token = $client->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/packages', [
                'package_name' => 'Test Package',
                'package_description' => 'Test Description',
                'package_category' => 'Wedding',
                'package_price' => 5000.00,
            ]);

        $response->assertStatus(403);
    }

    public function test_packages_can_be_filtered_by_search()
    {
        EventPackage::factory()->create(['package_name' => 'Wedding Package']);
        EventPackage::factory()->create(['package_name' => 'Birthday Package']);

        $response = $this->getJson('/api/packages?search=Wedding');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Wedding Package', $data[0]['package_name']);
    }

    public function test_packages_can_be_filtered_by_price_range()
    {
        EventPackage::factory()->create(['package_price' => 3000]);
        EventPackage::factory()->create(['package_price' => 5000]);
        EventPackage::factory()->create(['package_price' => 7000]);

        $response = $this->getJson('/api/packages?minPrice=4000&maxPrice=6000');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals(5000, $data[0]['package_price']);
    }
}

