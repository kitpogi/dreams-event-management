# Backend Improvements - How It Works

This document explains how the backend improvements work, including the architecture, flow, and implementation details.

## Table of Contents

1. [Standardized API Response Format](#standardized-api-response-format)
2. [Custom Exception Handling](#custom-exception-handling)
3. [FormRequest Validation](#formrequest-validation)
4. [Password Security](#password-security)
5. [Account Lockout System](#account-lockout-system)
6. [Refresh Token System](#refresh-token-system)
7. [Authorization Policies](#authorization-policies)

---

## Standardized API Response Format

### Overview
All API responses follow a consistent structure to make client-side handling easier and more predictable.

### Implementation

**Location**: `app/Traits/ApiResponse.php`

The `ApiResponse` trait provides helper methods for consistent responses:

```php
// Success response
$this->successResponse($data, 'Message', 200);

// Error response
$this->errorResponse('Error message', 400, $errors, 'ERROR_CODE');

// Paginated response
$this->paginatedResponse($data, $meta, 'Message');
```

### Response Structure

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error_code": "ERROR_CODE",
  "errors": { ... }
}
```

### Usage
All controllers extend `Controller` which uses the `ApiResponse` trait, making these methods available everywhere:

```php
class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        // ... logic ...
        return $this->successResponse($data, 'Login successful');
    }
}
```

### Benefits
- Consistent response format across all endpoints
- Easier error handling on frontend
- Error codes for programmatic handling
- Better debugging with structured responses

---

## Custom Exception Handling

### Overview
Custom exceptions provide better error handling with standardized responses and error codes.

### Implementation

**Base Exception**: `app/Exceptions/ApiException.php`

All custom exceptions extend `ApiException`:

```php
class ApiException extends Exception
{
    protected $statusCode;
    protected $errorCode;
    protected $errors;
    
    public function render(Request $request): JsonResponse
    {
        // Returns standardized error response
    }
}
```

**Specific Exceptions:**
- `ValidationException` - 422 validation errors
- `NotFoundException` - 404 resource not found
- `UnauthorizedException` - 401 authentication required
- `ForbiddenException` - 403 insufficient permissions

### Global Exception Handler

**Location**: `bootstrap/app.php`

The exception handler automatically converts exceptions to API responses:

```php
->withExceptions(function (Exceptions $exceptions) {
    // Handle API exceptions
    $exceptions->render(function (\App\Exceptions\ApiException $e, $request) {
        return $e->render($request);
    });
    
    // Handle validation exceptions
    $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
        if ($request->expectsJson()) {
            return response()->json([...], 422);
        }
    });
    
    // ... more handlers
})
```

### Flow

1. **Exception Thrown**: Controller throws custom exception
2. **Handler Catches**: Global handler intercepts
3. **Response Generated**: Exception's `render()` method creates JSON response
4. **Client Receives**: Standardized error response with error code

### Example

```php
// In controller
throw new NotFoundException('Booking not found', 'Booking');

// Response to client
{
  "success": false,
  "message": "Booking not found",
  "error_code": "NOT_FOUND"
}
```

---

## FormRequest Validation

### Overview
FormRequest classes centralize validation logic and provide better error messages.

### Implementation

**Example**: `app/Http/Requests/Auth/RegisterRequest.php`

```php
class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ];
    }
    
    public function messages(): array
    {
        return [
            'email.required' => 'Email is required',
            // ... custom messages
        ];
    }
}
```

### Usage in Controllers

```php
public function register(RegisterRequest $request)
{
    // Validation already passed!
    // $request->validated() contains clean data
    $user = User::create($request->validated());
}
```

### Flow

1. **Request Received**: HTTP request arrives
2. **FormRequest Validates**: Rules checked automatically
3. **If Invalid**: Returns 422 with validation errors
4. **If Valid**: Controller method executes with validated data

### Benefits
- Separation of concerns (validation separate from business logic)
- Reusable validation rules
- Custom error messages
- Automatic error response formatting

---

## Password Security

### Overview
Strong password requirements are enforced to improve account security.

### Implementation

**Password Rules**: Using Laravel's `Password` rule

```php
Password::min(8)
    ->letters()      // At least one letter
    ->mixedCase()    // At least one uppercase and lowercase
    ->numbers()      // At least one number
    ->symbols()      // At least one special character
```

**Applied To:**
- User registration
- Password changes
- Password resets
- Coordinator creation

### Validation Flow

1. **User Submits**: Password in registration/reset form
2. **FormRequest Validates**: Checks against password rules
3. **If Weak**: Returns validation error with requirements
4. **If Strong**: Password hashed and stored

### Error Messages

```json
{
  "success": false,
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "errors": {
    "password": [
      "The password must contain at least one uppercase and one lowercase letter.",
      "The password must contain at least one symbol."
    ]
  }
}
```

---

## Account Lockout System

### Overview
Prevents brute force attacks by locking accounts after multiple failed login attempts.

### Database Schema

**Migration**: `2026_01_23_000000_add_failed_login_attempts_to_users_table.php`

```php
Schema::table('users', function (Blueprint $table) {
    $table->integer('failed_login_attempts')->default(0);
    $table->timestamp('locked_until')->nullable();
});
```

### User Model Methods

**Location**: `app/Models/User.php`

```php
// Check if account is locked
public function isLocked(): bool
{
    return $this->locked_until && $this->locked_until->isFuture();
}

// Increment failed attempts (locks after 5)
public function incrementFailedLoginAttempts(): void
{
    $this->increment('failed_login_attempts');
    if ($this->failed_login_attempts >= 5) {
        $this->lockAccount(30); // Lock for 30 minutes
    }
}

// Reset on successful login
public function resetFailedLoginAttempts(): void
{
    $this->update(['failed_login_attempts' => 0]);
}
```

### Login Flow

1. **User Attempts Login**: Submits credentials
2. **Check if Locked**: If `locked_until` is in future, reject
3. **Validate Credentials**: Check email/password
4. **If Invalid**:
   - Increment `failed_login_attempts`
   - If >= 5 attempts, lock account for 30 minutes
   - Return error
5. **If Valid**:
   - Reset `failed_login_attempts`
   - Clear `locked_until`
   - Generate tokens

### Lockout Response

```json
{
  "success": false,
  "message": "Account is locked. Please try again in 25 minutes.",
  "error_code": "VALIDATION_ERROR",
  "errors": {
    "email": ["Account is locked. Please try again in 25 minutes."]
  }
}
```

### Unlock Conditions

- **Automatic**: After `locked_until` timestamp passes
- **Password Reset**: Account unlocked when password is reset
- **Manual**: Admin can unlock (if implemented)

---

## Refresh Token System

### Overview
Implements access token (short-lived) and refresh token (long-lived) pattern for better security.

### Architecture

**Token Types:**
- **Access Token**: 1 hour expiration, full permissions (`*`)
- **Refresh Token**: 30 days expiration, only `refresh` permission

### TokenService

**Location**: `app/Services/TokenService.php`

```php
class TokenService
{
    public function createTokens(User $user, ?string $deviceName = null): array
    {
        // Access token (1 hour)
        $accessToken = $user->createToken(
            'access_token',
            ['*'],
            now()->addHour()
        )->plainTextToken;

        // Refresh token (30 days)
        $refreshToken = $user->createToken(
            'refresh_token',
            ['refresh'],
            now()->addDays(30)
        )->plainTextToken;

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ];
    }
}
```

### Login/Register Flow

1. **User Authenticates**: Login or register
2. **Tokens Created**: Both access and refresh tokens generated
3. **Response Sent**: Client receives both tokens

```json
{
  "success": true,
  "data": {
    "access_token": "1|abc123...",
    "refresh_token": "2|xyz789...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": { ... }
  }
}
```

### Token Refresh Flow

**Endpoint**: `POST /api/auth/refresh`

1. **Client Sends**: Refresh token (when access token expires)
2. **Server Validates**: Checks token exists and has `refresh` permission
3. **If Valid**:
   - Revokes old access tokens
   - Creates new access token
   - Returns new access token
4. **If Invalid**: Returns 401 error

```php
public function refresh(Request $request)
{
    $result = $this->tokenService->refreshAccessToken($request->refresh_token);
    
    if (!$result) {
        return $this->unauthorizedResponse('Invalid or expired refresh token');
    }
    
    return $this->successResponse($result);
}
```

### Token Revocation

**Endpoints:**
- `POST /api/auth/revoke` - Revoke specific refresh token
- `POST /api/auth/revoke-all` - Revoke all tokens for user

### Security Features

- **Token Rotation**: Old access tokens revoked on refresh
- **Device Tracking**: Refresh tokens tagged with device name
- **Permission Scoping**: Refresh tokens can only refresh, not access resources
- **Expiration**: Automatic cleanup of expired tokens

---

## Authorization Policies

### Overview
Policies provide fine-grained authorization control for resources.

### Implementation

**BookingPolicy**: `app/Policies/BookingPolicy.php`

```php
class BookingPolicy
{
    // Who can view bookings
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users
    }
    
    // Who can view specific booking
    public function view(User $user, BookingDetail $booking): bool
    {
        if ($user->isAdmin()) {
            // Coordinators only see assigned bookings
            if ($user->isCoordinator()) {
                return $booking->coordinator_id === $user->id;
            }
            return true; // Admins see all
        }
        
        // Clients see only their own
        $client = $this->clientService->getByUserEmail($user->email);
        return $client && $booking->client_id === $client->client_id;
    }
    
    // Who can create bookings
    public function create(User $user): bool
    {
        return $user->role === 'client';
    }
    
    // Who can update bookings
    public function update(User $user, BookingDetail $booking): bool
    {
        if ($user->isAdmin()) return true;
        
        // Clients can only update their own (with restrictions)
        $client = $this->clientService->getByUserEmail($user->email);
        if ($client && $booking->client_id === $client->client_id) {
            // Can't update confirmed/completed bookings
            return !in_array(strtolower($booking->booking_status), 
                ['confirmed', 'completed', 'cancelled']);
        }
        return false;
    }
}
```

### Policy Registration

**Location**: `app/Providers/AuthServiceProvider.php`

```php
protected $policies = [
    BookingDetail::class => BookingPolicy::class,
    EventPackage::class => PackagePolicy::class,
];
```

### Usage in Controllers

```php
public function show(Request $request, $id)
{
    $booking = BookingDetail::findOrFail($id);
    
    // Check authorization using policy
    $this->authorize('view', $booking);
    
    // Or use Gate facade
    if (!Gate::allows('view', $booking)) {
        throw new ForbiddenException();
    }
    
    return $this->successResponse($booking);
}
```

### Authorization Flow

1. **Request Arrives**: User requests resource
2. **Policy Checked**: `authorize()` calls policy method
3. **If Allowed**: Request proceeds
4. **If Denied**: `AuthorizationException` thrown → 403 response

### Benefits

- **Centralized Logic**: All authorization rules in one place
- **Reusable**: Same policy used across controllers
- **Testable**: Easy to unit test authorization logic
- **Maintainable**: Changes in one place affect all usage

---

## Integration Flow Example

### Complete Login Flow

1. **Client**: `POST /api/auth/login` with credentials
2. **FormRequest**: `LoginRequest` validates email/password format
3. **Controller**: Checks account lockout status
4. **Controller**: Validates credentials
5. **If Invalid**: Increments failed attempts, locks if needed
6. **If Valid**: Resets failed attempts
7. **TokenService**: Creates access + refresh tokens
8. **Response**: Returns standardized success response with tokens

### Complete Resource Access Flow

1. **Client**: `GET /api/bookings/{id}` with access token
2. **Middleware**: Sanctum authenticates token
3. **Controller**: Loads booking from database
4. **Policy**: `BookingPolicy::view()` checks permissions
5. **If Denied**: Throws `AuthorizationException` → 403 response
6. **If Allowed**: Returns booking data in standardized format

---

## Error Handling Flow

### Request → Response Journey

1. **Request Arrives**: HTTP request to API endpoint
2. **Middleware**: Authentication, rate limiting, CORS
3. **FormRequest**: Validation (if applicable)
4. **Controller**: Business logic execution
5. **Policy**: Authorization check (if applicable)
6. **Exception**: Any error thrown
7. **Handler**: Global exception handler catches
8. **Response**: Standardized JSON response sent

### Error Response Example

```json
{
  "success": false,
  "message": "You do not have permission to view this booking",
  "error_code": "FORBIDDEN"
}
```

---

## Best Practices Implemented

1. **Separation of Concerns**: Validation, authorization, and business logic separated
2. **DRY Principle**: Reusable traits, services, and policies
3. **Security First**: Strong passwords, account lockout, token expiration
4. **Consistent API**: Standardized responses across all endpoints
5. **Error Handling**: Comprehensive exception handling with error codes
6. **Maintainability**: Clear structure, well-documented code

---

## Testing Recommendations

1. **Unit Tests**: Test policies, services, and exceptions
2. **Feature Tests**: Test complete flows (login, refresh, authorization)
3. **Security Tests**: Test account lockout, password strength, token expiration
4. **Integration Tests**: Test end-to-end flows with database

---

## Summary

The backend improvements create a robust, secure, and maintainable API with:

- ✅ Consistent response format
- ✅ Comprehensive error handling
- ✅ Strong password security
- ✅ Account lockout protection
- ✅ Refresh token system
- ✅ Fine-grained authorization
- ✅ Clean code architecture

All improvements work together to provide a secure, scalable, and developer-friendly API.
