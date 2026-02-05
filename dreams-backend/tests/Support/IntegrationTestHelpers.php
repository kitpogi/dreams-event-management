<?php

namespace Tests\Support;

use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Trait for integration tests that need a properly configured database.
 * 
 * This trait handles the SQLite vs MySQL compatibility issues by:
 * 1. Ensuring proper migration order
 * 2. Providing helper methods to create test data with correct schema
 * 3. Disabling problematic service providers during tests
 */
trait IntegrationTestHelpers
{
    use RefreshDatabase;

    /**
     * Boot the testing helper.
     */
    protected function setUpIntegrationTest(): void
    {
        // Disable query logging to avoid "Log [query] not defined" error
        config(['logging.channels.query' => [
            'driver' => 'single',
            'path' => storage_path('logs/query.log'),
            'level' => 'debug',
        ]]);

        // Ensure we're using the test database
        $this->assertDatabaseConnection();
    }

    /**
     * Assert that we have a valid database connection.
     */
    protected function assertDatabaseConnection(): void
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
        } catch (\Exception $e) {
            $this->fail('Could not connect to database: ' . $e->getMessage());
        }
    }

    /**
     * Create a test user with specified role.
     */
    protected function createTestUser(string $role = 'user', array $attributes = []): \App\Models\User
    {
        return \App\Models\User::factory()->create(array_merge([
            'role' => $role,
        ], $attributes));
    }

    /**
     * Create a test admin user.
     */
    protected function createAdminUser(array $attributes = []): \App\Models\User
    {
        return $this->createTestUser('admin', $attributes);
    }

    /**
     * Create a test coordinator user.
     */
    protected function createCoordinatorUser(array $attributes = []): \App\Models\User
    {
        return $this->createTestUser('coordinator', $attributes);
    }

    /**
     * Create a test client.
     */
    protected function createTestClient(array $attributes = []): \App\Models\Client
    {
        return \App\Models\Client::factory()->create($attributes);
    }

    /**
     * Create a test event package.
     */
    protected function createTestPackage(array $attributes = []): \App\Models\EventPackage
    {
        return \App\Models\EventPackage::factory()->create($attributes);
    }

    /**
     * Create a test venue.
     */
    protected function createTestVenue(array $attributes = []): \App\Models\Venue
    {
        return \App\Models\Venue::factory()->create($attributes);
    }

    /**
     * Create a test booking with all required relationships.
     */
    protected function createTestBooking(array $attributes = []): \App\Models\BookingDetail
    {
        $client = $attributes['client'] ?? $this->createTestClient();
        $package = $attributes['package'] ?? $this->createTestPackage();

        unset($attributes['client'], $attributes['package']);

        return \App\Models\BookingDetail::factory()->create(array_merge([
            'client_id' => $client->client_id,
            'package_id' => $package->package_id,
        ], $attributes));
    }

    /**
     * Act as an authenticated user.
     */
    protected function actAsUser(?string $role = null): \App\Models\User
    {
        $user = $role ? $this->createTestUser($role) : $this->createTestUser();
        $this->actingAs($user);
        return $user;
    }

    /**
     * Act as an authenticated admin.
     */
    protected function actAsAdmin(): \App\Models\User
    {
        return $this->actAsUser('admin');
    }

    /**
     * Act as an authenticated coordinator.
     */
    protected function actAsCoordinator(): \App\Models\User
    {
        return $this->actAsUser('coordinator');
    }

    /**
     * Assert a JSON API response structure.
     */
    protected function assertJsonApiResponse($response, int $status = 200): void
    {
        $response->assertStatus($status);
        $response->assertHeader('Content-Type', 'application/json');
    }

    /**
     * Assert a successful JSON response with data.
     */
    protected function assertSuccessResponse($response, ?string $message = null): void
    {
        $response->assertStatus(200);
        
        if ($message) {
            $response->assertJson(['message' => $message]);
        }
    }

    /**
     * Assert an error response.
     */
    protected function assertErrorResponse($response, int $status = 400): void
    {
        $response->assertStatus($status);
    }

    /**
     * Get a fresh service instance from the container.
     */
    protected function getService(string $class)
    {
        return app($class);
    }
}
