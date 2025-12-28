# Swagger/OpenAPI Documentation Guide

## Overview

The Dreams Event Management System API is fully documented using Swagger/OpenAPI 3.0. This documentation provides interactive API exploration, request/response examples, and authentication details.

## Accessing the Documentation

### Development Environment

1. **Swagger UI**: Navigate to `http://localhost:8000/api/documentation`
2. **JSON Schema**: Available at `http://localhost:8000/docs/api-docs.json`
3. **YAML Schema**: Available at `http://localhost:8000/docs/api-docs.yaml` (if enabled)

### Production Environment

Replace `localhost:8000` with your production domain.

## Features

### 1. Interactive API Explorer

- **Try It Out**: Test endpoints directly from the Swagger UI
- **Request/Response Examples**: See example payloads and responses
- **Parameter Descriptions**: Understand each parameter's purpose and constraints
- **Authentication**: Test authenticated endpoints with your token

### 2. Authentication

The API uses Laravel Sanctum for authentication. To use protected endpoints:

1. **Get Your Token**:

   - Register: `POST /api/auth/register`
   - Login: `POST /api/auth/login`
   - Copy the `token` from the response

2. **Use the Token**:
   - Click the "Authorize" button in Swagger UI
   - Enter: `Bearer <your-token>`
   - All protected endpoints will now use this token

### 3. API Endpoints Documentation

#### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get authenticated user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/create-coordinator` - Create coordinator (Admin only)

#### Package Endpoints

- `GET /api/packages` - List all packages (with filters)
- `GET /api/packages/{id}` - Get package details
- `POST /api/packages` - Create package (Admin only)
- `PUT /api/packages/{id}` - Update package (Admin only)
- `DELETE /api/packages/{id}` - Delete package (Admin only)

#### Booking Endpoints

- `GET /api/bookings` - List bookings (filtered by user role)
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/{id}` - Update booking
- `GET /api/bookings/calendar` - Get calendar view (Admin only)
- `GET /api/bookings/export` - Export bookings as CSV (Admin only)
- `PATCH /api/bookings/status/{id}` - Update booking status (Admin only)
- `GET /api/bookings/check-availability` - Check date availability
- `GET /api/bookings/available-dates` - Get available dates for package

#### Other Endpoints

- Venues, Portfolio, Testimonials, Reviews, Contact, Analytics, Audit Logs, etc.

## Generating Documentation

### Automatic Generation

The documentation is automatically generated when:

- Running `php artisan l5-swagger:generate`
- In development mode (if `L5_SWAGGER_GENERATE_ALWAYS=true`)

### Manual Generation

```bash
php artisan l5-swagger:generate
```

### Configuration

Edit `config/l5-swagger.php` to customize:

- API title and description
- Server URL
- Security schemes
- Documentation format (JSON/YAML)

## Environment Variables

Add to your `.env` file:

```env
# Swagger Configuration
L5_SWAGGER_GENERATE_ALWAYS=false  # Set to true in development
L5_SWAGGER_BASE_PATH=null  # API base path (null = auto-detect)
L5_SWAGGER_USE_ABSOLUTE_PATH=true
L5_FORMAT_TO_USE_FOR_DOCS=json  # json or yaml
L5_SWAGGER_GENERATE_YAML_COPY=false
L5_SWAGGER_OPEN_API_SPEC_VERSION=3.0.0
```

## Adding New Endpoints

To document a new endpoint, add Swagger annotations to your controller:

```php
/**
 * @OA\Post(
 *     path="/api/your-endpoint",
 *     summary="Your endpoint description",
 *     tags={"YourTag"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"field1", "field2"},
 *             @OA\Property(property="field1", type="string", example="value1"),
 *             @OA\Property(property="field2", type="integer", example=123)
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Success response",
 *         @OA\JsonContent(
 *             @OA\Property(property="data", type="object")
 *         )
 *     ),
 *     @OA\Response(response=422, description="Validation error")
 * )
 */
public function yourMethod(Request $request)
{
    // Your code
}
```

## Common Annotations

### Request Parameters

```php
@OA\Parameter(
    name="id",
    in="path",  // path, query, header, cookie
    required=true,
    @OA\Schema(type="integer")
)
```

### Request Body

```php
@OA\RequestBody(
    required=true,
    @OA\JsonContent(
        required={"field1"},
        @OA\Property(property="field1", type="string", example="value")
    )
)
```

### Responses

```php
@OA\Response(
    response=200,
    description="Success",
    @OA\JsonContent(
        @OA\Property(property="data", type="object")
    )
)
```

### Security

```php
security={{"sanctum": {}}}  // Requires authentication
```

## Tags

Endpoints are organized by tags:

- Authentication
- Packages
- Bookings
- Clients
- Venues
- Portfolio
- Testimonials
- Reviews
- Contact
- Analytics
- Audit Logs
- Preferences
- Recommendations

## Best Practices

1. **Always Document**: Add Swagger annotations when creating new endpoints
2. **Use Examples**: Provide example values for better understanding
3. **Describe Parameters**: Explain what each parameter does
4. **Document Errors**: Include all possible error responses
5. **Keep Updated**: Regenerate documentation after changes
6. **Use Tags**: Organize endpoints with appropriate tags

## Troubleshooting

### Documentation Not Updating

1. Clear cache: `php artisan cache:clear`
2. Regenerate: `php artisan l5-swagger:generate`
3. Check file permissions on `storage/api-docs/`

### Authentication Not Working

1. Ensure you're using `Bearer <token>` format
2. Check token hasn't expired
3. Verify user has required permissions

### Missing Endpoints

1. Check annotations are properly formatted
2. Verify controller is in `app/Http/Controllers/Api/`
3. Run `php artisan l5-swagger:generate` again

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [L5-Swagger Documentation](https://github.com/DarkaOnLine/L5-Swagger)
- [Swagger PHP Annotations](https://zircote.github.io/swagger-php/)

## Support

For issues or questions about the API documentation:

- Check the Swagger UI for interactive examples
- Review controller annotations in the codebase
- Consult the main API documentation
