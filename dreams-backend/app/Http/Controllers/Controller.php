<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * @OA\Info(
 *     title="Dreams Event Management System API",
 *     version="1.0.0",
 *     description="API documentation for Dreams Event Management System. This API provides endpoints for managing events, bookings, packages, venues, and more.",
 *     @OA\Contact(
 *         email="support@dreamsevents.com"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 * 
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Laravel Sanctum token authentication. Get your token by logging in at /api/auth/login"
 * )
 * 
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication and authorization endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Packages",
 *     description="Event package management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Bookings",
 *     description="Booking management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Clients",
 *     description="Client management endpoints (Admin only)"
 * )
 * 
 * @OA\Tag(
 *     name="Venues",
 *     description="Venue management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Portfolio",
 *     description="Portfolio item management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Testimonials",
 *     description="Testimonial management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Reviews",
 *     description="Review management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Contact",
 *     description="Contact inquiry endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Analytics",
 *     description="Analytics and reporting endpoints (Admin only)"
 * )
 * 
 * @OA\Tag(
 *     name="Audit Logs",
 *     description="Audit log endpoints (Admin only)"
 * )
 * 
 * @OA\Tag(
 *     name="Preferences",
 *     description="Event preference management endpoints"
 * )
 * 
 * @OA\Tag(
 *     name="Recommendations",
 *     description="Package recommendation endpoints"
 * )
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
