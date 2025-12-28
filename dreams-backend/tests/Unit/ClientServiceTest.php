<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ClientService;
use App\Models\User;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ClientServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $clientService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clientService = new ClientService();
    }

    /** @test */
    public function it_can_find_or_create_client_from_user()
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
        ]);

        $client = $this->clientService->findOrCreateFromUser($user);

        $this->assertInstanceOf(Client::class, $client);
        $this->assertEquals($user->email, $client->client_email);
        $this->assertEquals($user->name, $client->client_fname);
        $this->assertEquals($user->name, $client->client_lname);
        $this->assertEquals($user->phone, $client->client_contact);
    }

    /** @test */
    public function it_returns_existing_client_if_already_exists()
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        // Create client first
        $existingClient = Client::factory()->create([
            'client_email' => $user->email,
            'client_fname' => 'Existing',
        ]);

        // Try to find or create
        $client = $this->clientService->findOrCreateFromUser($user);

        $this->assertEquals($existingClient->client_id, $client->client_id);
        $this->assertEquals('Existing', $client->client_fname);
        
        // Verify only one client exists
        $this->assertEquals(1, Client::where('client_email', $user->email)->count());
    }

    /** @test */
    public function it_handles_user_with_empty_name()
    {
        $user = User::factory()->create([
            'name' => '',
            'email' => 'noname@example.com',
        ]);

        $client = $this->clientService->findOrCreateFromUser($user);

        $this->assertEquals('Client', $client->client_fname);
        $this->assertEquals('Client', $client->client_lname);
    }

    /** @test */
    public function it_handles_user_without_phone()
    {
        $user = User::factory()->create([
            'email' => 'nophone@example.com',
            'phone' => null,
        ]);

        $client = $this->clientService->findOrCreateFromUser($user);

        $this->assertEquals('', $client->client_contact);
    }

    /** @test */
    public function it_can_get_client_by_email()
    {
        $client = Client::factory()->create([
            'client_email' => 'test@example.com',
        ]);

        $found = $this->clientService->getByUserEmail('test@example.com');

        $this->assertInstanceOf(Client::class, $found);
        $this->assertEquals($client->client_id, $found->client_id);
    }

    /** @test */
    public function it_returns_null_when_client_not_found_by_email()
    {
        $found = $this->clientService->getByUserEmail('nonexistent@example.com');

        $this->assertNull($found);
    }
}

