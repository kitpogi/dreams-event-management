# Rate Limiting Configuration

This document describes the rate limiting configuration for the Dreams Events API.

## Overview

Rate limiting is implemented to prevent API abuse, ensure system stability, and protect against brute force attacks. Different rate limits are applied based on the type of endpoint and user authentication status.

## Rate Limiter Definitions

Rate limiters are defined in `bootstrap/app.php` using Laravel's rate limiting system:

### 1. **API Rate Limiter** (`api`)

- **Limit:** 60 requests per minute
- **Scope:** Per authenticated user ID or IP address
- **Applied to:** General authenticated endpoints
- **Purpose:** Standard rate limit for authenticated users

### 2. **Authentication Rate Limiter** (`auth`)

- **Limit:** 5 requests per minute
- **Scope:** Per IP address
- **Applied to:** Authentication endpoints (login, register, password reset, etc.)
- **Purpose:** Prevent brute force attacks and credential stuffing

### 3. **Public Rate Limiter** (`public`)

- **Limit:** 120 requests per minute
- **Scope:** Per IP address
- **Applied to:** Public read-only endpoints (packages, reviews, testimonials)
- **Purpose:** Allow higher limits for browsing content

### 4. **Admin Rate Limiter** (`admin`)

- **Limit:** 100 requests per minute
- **Scope:** Per authenticated admin/coordinator user ID or IP address
- **Applied to:** Admin-only endpoints
- **Purpose:** Higher limits for administrative operations

### 5. **Sensitive Operations Rate Limiter** (`sensitive`)

- **Limit:** 10 requests per minute
- **Scope:** Per authenticated user ID or IP address
- **Applied to:** Sensitive operations (contact form, recommendations)
- **Purpose:** Prevent abuse of resource-intensive or sensitive endpoints

## Rate Limiting by Endpoint Type

### Authentication Endpoints

- `/api/auth/register` - `throttle:auth` (5/min)
- `/api/auth/login` - `throttle:auth` (5/min)
- `/api/auth/google` - `throttle:auth` (5/min)
- `/api/auth/facebook` - `throttle:auth` (5/min)
- `/api/auth/forgot-password` - `throttle:auth` (5/min)
- `/api/auth/reset-password` - `throttle:auth` (5/min)
- `/api/auth/verify-email` - `throttle:auth` (5/min)
- `/api/auth/resend-verification` - `throttle:auth` (5/min)

### Public Endpoints

- `/api/packages` - `throttle:public` (120/min)
- `/api/packages/{id}` - `throttle:public` (120/min)
- `/api/venues` - `throttle:public` (120/min)
- `/api/portfolio-items` - `throttle:public` (120/min)
- `/api/testimonials` - `throttle:public` (120/min)
- `/api/reviews` - `throttle:public` (120/min)
- `/api/reviews/{id}` - `throttle:public` (120/min)
- `/api/packages/{packageId}/reviews` - `throttle:public` (120/min)

### Sensitive Public Endpoints

- `/api/contact` - `throttle:sensitive` (10/min)
- `/api/recommend` - `throttle:sensitive` (10/min)

### Authenticated Endpoints

- All routes under `auth:sanctum` middleware - `throttle:api` (60/min)
  - `/api/bookings/*`
  - `/api/reviews` (POST, PATCH, DELETE)
  - `/api/preferences/*`
  - `/api/testimonials/submit`

### Admin Endpoints

- All routes under `admin` middleware - `throttle:admin` (100/min)
  - `/api/auth/create-coordinator`
  - `/api/clients/*`
  - `/api/packages` (POST, PUT, PATCH, DELETE)
  - `/api/bookings/*` (admin operations)
  - `/api/contact-inquiries/*`
  - `/api/venues/*` (admin operations)
  - `/api/portfolio-items/*` (admin operations)
  - `/api/testimonials/*` (admin operations)

## Rate Limit Response

When a rate limit is exceeded, the API returns:

```json
{
  "message": "Too Many Attempts."
}
```

With HTTP status code `429 Too Many Requests`.

The response includes the following headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining
- `Retry-After`: Number of seconds to wait before retrying

## Customization

To modify rate limits, edit the rate limiter definitions in `bootstrap/app.php`:

```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
```

You can adjust:

- **Per minute limit:** Change the number in `perMinute()`
- **Per hour limit:** Use `perHour()` instead
- **Per day limit:** Use `perDay()` instead
- **Scope:** Change `by()` to use different identifiers

## Testing Rate Limits

To test rate limiting:

1. Make multiple rapid requests to an endpoint
2. Once the limit is exceeded, you'll receive a 429 response
3. Wait for the rate limit window to reset before making more requests

## Production Considerations

1. **Cache Driver:** Ensure you're using a persistent cache driver (Redis, database) in production for accurate rate limiting across multiple servers
2. **Monitoring:** Monitor rate limit violations to identify potential abuse
3. **Adjustment:** Adjust limits based on actual usage patterns and server capacity
4. **Whitelisting:** Consider whitelisting trusted IPs for higher limits if needed

## Environment Variables

Rate limiting uses Laravel's cache system. Configure your cache driver in `.env`:

```env
CACHE_DRIVER=redis  # Recommended for production
# or
CACHE_DRIVER=database  # Alternative for production
```

For development, `file` cache driver works but may not be accurate across multiple processes.
