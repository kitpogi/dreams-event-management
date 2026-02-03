<?php

namespace Tests\Traits;

use App\Models\User;
use Illuminate\Testing\TestResponse;

trait AuthenticatesUsers
{
    /**
     * Create and authenticate a user
     */
    protected function authenticateUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $this->actingAs($user);
        return $user;
    }

    /**
     * Create and authenticate an admin user
     */
    protected function authenticateAdmin(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 'admin',
        ], $attributes));
        $this->actingAs($user);
        return $user;
    }

    /**
     * Create and authenticate a coordinator user
     */
    protected function authenticateCoordinator(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 'coordinator',
        ], $attributes));
        $this->actingAs($user);
        return $user;
    }

    /**
     * Create and authenticate a client user
     */
    protected function authenticateClient(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 'client',
        ], $attributes));
        $this->actingAs($user);
        return $user;
    }

    /**
     * Get authorization header with token
     */
    protected function getAuthHeader(User $user = null): array
    {
        $user = $user ?? $this->authenticateUser();
        $token = $user->createToken('test-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }
}
