<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    /**
     * Test user can login with valid credentials
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->jsonApi('POST', '/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user',
                    'token',
                ],
            ]);
    }

    /**
     * Test user cannot login with invalid password
     */
    public function test_user_cannot_login_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->jsonApi('POST', '/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonStructure(['success', 'message']);
    }

    /**
     * Test user cannot login with non-existent email
     */
    public function test_user_cannot_login_with_non_existent_email(): void
    {
        $response = $this->jsonApi('POST', '/api/auth/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJsonStructure(['success', 'message']);
    }

    /**
     * Test user can register with valid data
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->jsonApi('POST', '/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user',
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@test.com',
        ]);
    }

    /**
     * Test user cannot register with weak password
     */
    public function test_user_cannot_register_with_weak_password(): void
    {
        $response = $this->jsonApi('POST', '/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['success', 'message', 'errors']);
    }

    /**
     * Test authenticated user can logout
     */
    public function test_authenticated_user_can_logout(): void
    {
        $user = $this->authenticateUser();

        $response = $this->jsonApi('POST', '/api/auth/logout', [], $this->getAuthHeader($user));

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'message']);
    }

    /**
     * Test unauthenticated user cannot access protected route
     */
    public function test_unauthenticated_user_cannot_access_protected_route(): void
    {
        $response = $this->jsonApi('GET', '/api/user/profile');

        $response->assertStatus(401);
    }
}
