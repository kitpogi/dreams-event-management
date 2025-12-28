# Testing Guide - Dreams Event Management System

## Overview

This guide provides comprehensive information about the test suite for the Dreams Event Management System API.

## Test Suite Structure

### Feature Tests (Integration Tests)

Located in `tests/Feature/`, these tests verify API endpoints work correctly:

1. **AuthTest.php** - Authentication endpoints

   - User registration and validation
   - Login/logout functionality
   - Password reset flow
   - Email verification
   - Coordinator creation (admin only)
   - Protected route access

2. **PackageTest.php** - Package management

   - Public package viewing
   - Package filtering and search
   - Admin CRUD operations
   - Authorization checks

3. **BookingTest.php** - Booking management
   - Booking creation and validation
   - User-specific booking viewing
   - Admin booking management
   - Status updates
   - Availability checking

## Running Tests

### Prerequisites

Ensure you have:

- PHP 8.1+ installed
- Composer dependencies installed (`composer install`)
- Database configured (tests use in-memory SQLite by default)

### Basic Commands

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/AuthTest.php

# Run specific test method
php artisan test --filter test_user_can_register

# Run with verbose output
php artisan test -v

# Run with code coverage
php artisan test --coverage

# Run tests in parallel (faster)
php artisan test --parallel
```

## Test Database

Tests use an in-memory SQLite database that is automatically refreshed before each test. This ensures:

- Clean state for each test
- Fast test execution
- No interference between tests

### Database Configuration

The test environment automatically uses:

- Connection: `sqlite`
- Database: `:memory:` (in-memory)

No manual database setup required!

## Factories

Test data is generated using Laravel factories located in `database/factories/`:

### Available Factories

1. **UserFactory**

   ```php
   User::factory()->create();                    // Regular user
   User::factory()->admin()->create();           // Admin user
   User::factory()->coordinator()->create();     // Coordinator user
   ```

2. **EventPackageFactory**

   ```php
   EventPackage::factory()->create();
   EventPackage::factory()->count(5)->create();
   ```

3. **VenueFactory**

   ```php
   Venue::factory()->create();
   ```

4. **ClientFactory**

   ```php
   Client::factory()->create();
   ```

5. **BookingDetailFactory**
   ```php
   BookingDetail::factory()->create();
   BookingDetail::factory()->approved()->create();
   BookingDetail::factory()->pending()->create();
   ```

## Writing Tests

### Test Structure

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MyTest extends TestCase
{
    use RefreshDatabase; // Always include this!

    public function test_something()
    {
        // Arrange: Set up test data
        $user = User::factory()->create();

        // Act: Perform the action
        $response = $this->getJson('/api/endpoint');

        // Assert: Verify the result
        $response->assertStatus(200);
    }
}
```

### Authentication in Tests

```php
// Create authenticated user
$user = User::factory()->create();
$token = $user->createToken('test-token')->plainTextToken;

// Make authenticated request
$response = $this->withHeader('Authorization', "Bearer {$token}")
    ->getJson('/api/protected-endpoint');
```

### Testing Admin Endpoints

```php
$admin = User::factory()->admin()->create();
$token = $admin->createToken('test-token')->plainTextToken;

$response = $this->withHeader('Authorization', "Bearer {$token}")
    ->postJson('/api/admin-only-endpoint');
```

### Common Assertions

```php
// Status codes
$response->assertStatus(200);
$response->assertStatus(201);
$response->assertStatus(422); // Validation error
$response->assertStatus(403); // Forbidden
$response->assertStatus(401); // Unauthorized

// JSON structure
$response->assertJsonStructure(['data', 'meta']);

// JSON content
$response->assertJson(['message' => 'Success']);

// Validation errors
$response->assertJsonValidationErrors(['email', 'password']);

// Database assertions
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);
```

## Test Coverage

### Current Coverage

- ✅ Authentication endpoints (register, login, logout, password reset)
- ✅ Package endpoints (CRUD, filtering, search)
- ✅ Booking endpoints (create, view, status updates)
- ✅ Authorization checks (admin vs client)
- ✅ Validation testing

### Areas to Expand

- [ ] Venue management endpoints
- [ ] Portfolio endpoints
- [ ] Testimonial endpoints
- [ ] Review endpoints
- [ ] Contact inquiry endpoints
- [ ] Analytics endpoints
- [ ] Audit log endpoints
- [ ] Coordinator assignment endpoints

## Best Practices

1. **Always use RefreshDatabase**: Ensures clean database state
2. **Use factories**: Generate test data consistently
3. **Test both success and failure**: Cover all scenarios
4. **Test authorization**: Verify protected routes
5. **Test validation**: Ensure proper error handling
6. **Use descriptive names**: Test names should be clear
7. **Follow AAA pattern**: Arrange, Act, Assert

## Example Test Scenarios

### Testing Registration

```php
public function test_user_can_register()
{
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['token', 'user', 'message']);

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
        'role' => 'client',
    ]);
}
```

### Testing Protected Routes

```php
public function test_unauthenticated_user_cannot_access_protected_route()
{
    $response = $this->getJson('/api/auth/me');
    $response->assertStatus(401);
}
```

### Testing Admin-Only Endpoints

```php
public function test_non_admin_cannot_create_package()
{
    $client = User::factory()->create();
    $token = $client->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/packages', [...]);

    $response->assertStatus(403);
}
```

## Troubleshooting

### Tests Failing

1. **Clear cache**: `php artisan cache:clear`
2. **Refresh database**: `php artisan migrate:fresh`
3. **Check environment**: Ensure test environment is configured
4. **Verify factories**: Check factory definitions match models

### Database Issues

- Tests use in-memory SQLite by default
- No manual database setup needed
- Each test gets a fresh database

### Authentication Issues

- Verify Sanctum is configured
- Check token format: `Bearer {token}`
- Ensure user has correct role

## Continuous Integration

Tests should be run in CI/CD:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    composer install
    php artisan test
```

## Next Steps

1. Add more endpoint tests (venues, portfolio, testimonials)
2. Add unit tests for services
3. Add performance tests
4. Set up CI/CD pipeline
5. Increase code coverage to 80%+

## Resources

- [Laravel Testing Docs](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://phpunit.de/)
- [Laravel Factories](https://laravel.com/docs/eloquent-factories)
