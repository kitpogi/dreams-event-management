# API Testing Guide

This directory contains comprehensive test suites for the Dreams Event Management System API.

## Test Structure

```
tests/
├── Feature/          # Integration tests for API endpoints
│   ├── AuthTest.php
│   ├── PackageTest.php
│   └── BookingTest.php
├── Unit/             # Unit tests for individual components
├── TestCase.php      # Base test case class
└── CreatesApplication.php
```

## Running Tests

### Run All Tests

```bash
php artisan test
```

### Run Specific Test File

```bash
php artisan test tests/Feature/AuthTest.php
```

### Run Specific Test Method

```bash
php artisan test --filter test_user_can_register
```

### Run Tests with Coverage

```bash
php artisan test --coverage
```

### Run Tests in Parallel

```bash
php artisan test --parallel
```

## Test Categories

### Feature Tests (Integration Tests)

#### AuthTest.php

Tests authentication endpoints:

- User registration
- User login/logout
- Password reset flow
- Email verification
- Coordinator creation (admin only)
- Protected route access

#### PackageTest.php

Tests package management endpoints:

- Public package viewing
- Package filtering (search, price, category)
- Admin package CRUD operations
- Authorization checks

#### BookingTest.php

Tests booking endpoints:

- Booking creation
- Booking viewing (user-specific and admin)
- Booking status updates
- Date validation
- Availability checking

## Test Database

Tests use a separate in-memory SQLite database by default. The database is refreshed before each test using `RefreshDatabase` trait.

### Configuration

The test database is configured in `phpunit.xml` (if it exists) or via environment variables:

```env
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
```

## Factories

Test data is generated using Laravel factories:

- `UserFactory` - Creates test users (admin, coordinator, client)
- `EventPackageFactory` - Creates test packages
- `VenueFactory` - Creates test venues
- `ClientFactory` - Creates test clients
- `BookingDetailFactory` - Creates test bookings

### Using Factories in Tests

```php
// Create a single user
$user = User::factory()->create();

// Create an admin user
$admin = User::factory()->admin()->create();

// Create multiple packages
$packages = EventPackage::factory()->count(5)->create();
```

## Writing New Tests

### Example: Testing a New Endpoint

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MyNewEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoint_returns_success()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/my-endpoint');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
            ]);
    }
}
```

## Test Assertions

### Common Assertions

```php
// Status code
$response->assertStatus(200);

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

## Authentication in Tests

### Creating Authenticated Requests

```php
$user = User::factory()->create();
$token = $user->createToken('test-token')->plainTextToken;

$response = $this->withHeader('Authorization', "Bearer {$token}")
    ->getJson('/api/protected-endpoint');
```

### Testing Admin-Only Endpoints

```php
$admin = User::factory()->admin()->create();
$token = $admin->createToken('test-token')->plainTextToken;

$response = $this->withHeader('Authorization', "Bearer {$token}")
    ->postJson('/api/admin-only-endpoint');
```

## Best Practices

1. **Use RefreshDatabase**: Always use `RefreshDatabase` trait to ensure clean database state
2. **Use Factories**: Generate test data using factories instead of manual creation
3. **Test Both Success and Failure**: Test both valid and invalid inputs
4. **Test Authorization**: Verify that protected endpoints require authentication
5. **Test Role-Based Access**: Verify admin-only endpoints reject non-admin users
6. **Use Descriptive Names**: Test method names should clearly describe what they test
7. **Arrange-Act-Assert**: Structure tests with clear sections

## Continuous Integration

Tests should be run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: php artisan test
```

## Troubleshooting

### Tests Failing Due to Database Issues

1. Clear test database: `php artisan migrate:fresh`
2. Check database configuration in test environment
3. Ensure `RefreshDatabase` trait is used

### Authentication Tests Failing

1. Verify Sanctum is properly configured
2. Check token format: `Bearer {token}`
3. Ensure user has correct role for admin tests

### Factory Errors

1. Ensure factories are in `database/factories/`
2. Check factory definitions match model structure
3. Verify model relationships are correct

## Coverage Goals

- **Feature Tests**: 80%+ coverage of API endpoints
- **Unit Tests**: 70%+ coverage of services and utilities
- **Critical Paths**: 100% coverage (auth, bookings, payments)

## Additional Resources

- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Laravel Factories](https://laravel.com/docs/eloquent-factories)
