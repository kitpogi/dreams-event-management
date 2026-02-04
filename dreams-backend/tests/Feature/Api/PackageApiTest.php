<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\EventPackage;
use Tests\TestCase;

class PackageApiTest extends TestCase
{
    /**
     * Test anyone can retrieve packages
     */
    public function test_anyone_can_retrieve_packages(): void
    {
        EventPackage::factory()->count(5)->create();

        $response = $this->jsonApi('GET', '/api/packages');

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
     * Test can retrieve single package
     */
    public function test_can_retrieve_single_package(): void
    {
        $package = EventPackage::factory()->create();

        $response = $this->jsonApi('GET', "/api/packages/{$package->package_id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'package_id',
                    'package_name',
                    'package_price',
                    'package_description',
                ],
            ]);
    }

    /**
     * Test admin can create package
     */
    public function test_admin_can_create_package(): void
    {
        $admin = $this->authenticateAdmin();

        $packageData = [
            'package_name' => 'Premium Package',
            'package_description' => 'A premium event package',
            'package_price' => 500000,
            'package_category' => 'wedding',
            'capacity' => 200,
            'package_inclusions' => 'Full catering, Photography, Decoration',
        ];

        $response = $this->jsonApi(
            'POST',
            '/api/packages',
            $packageData,
            $this->getAuthHeader($admin)
        );

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'package_id',
                    'package_name',
                    'package_price',
                ],
            ]);
    }

    /**
     * Test non-admin cannot create package
     */
    public function test_non_admin_cannot_create_package(): void
    {
        $user = $this->authenticateClient();

        $packageData = [
            'package_name' => 'Premium Package',
            'package_description' => 'A premium event package',
            'package_price' => 500000,
            'package_category' => 'wedding',
            'capacity' => 200,
            'package_inclusions' => 'Full catering, Photography',
        ];

        $response = $this->jsonApi(
            'POST',
            '/api/packages',
            $packageData,
            $this->getAuthHeader($user)
        );

        $response->assertStatus(403);
    }

    /**
     * Test admin can update package
     */
    public function test_admin_can_update_package(): void
    {
        $admin = $this->authenticateAdmin();
        $package = EventPackage::factory()->create();

        $updateData = [
            'package_name' => 'Updated Package Name',
            'package_price' => 600000,
        ];

        $response = $this->jsonApi(
            'PUT',
            "/api/packages/{$package->package_id}",
            $updateData,
            $this->getAuthHeader($admin)
        );

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);

        $this->assertDatabaseHas('event_packages', [
            'package_id' => $package->package_id,
            'package_name' => 'Updated Package Name',
        ]);
    }

    /**
     * Test admin can delete package
     */
    public function test_admin_can_delete_package(): void
    {
        $admin = $this->authenticateAdmin();
        $package = EventPackage::factory()->create();

        $response = $this->jsonApi(
            'DELETE',
            "/api/packages/{$package->package_id}",
            [],
            $this->getAuthHeader($admin)
        );

        $response->assertStatus(200);

        $this->assertDatabaseMissing('event_packages', [
            'package_id' => $package->package_id,
        ]);
    }
}
