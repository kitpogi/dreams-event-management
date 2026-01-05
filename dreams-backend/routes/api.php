<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\EventPreferenceController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\ImageAnalysisController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

// Public routes with rate limiting
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);
    Route::post('/auth/facebook', [AuthController::class, 'facebookLogin']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerificationEmail']);
});

// Public contact form with rate limiting
Route::middleware('throttle:sensitive')->post('/contact', [ContactController::class, 'store']);

// Public package viewing with rate limiting
Route::middleware('throttle:public')->group(function () {
    Route::get('/packages', [PackageController::class, 'index']);
    Route::get('/packages/{id}', [PackageController::class, 'show']);
    Route::get('/venues', [VenueController::class, 'index']);
    Route::get('/portfolio-items', [PortfolioController::class, 'index']);
    Route::get('/testimonials', [TestimonialController::class, 'index']);
    
    // Public review viewing
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);
    Route::get('/packages/{packageId}/reviews', [ReviewController::class, 'getPackageReviews']);
});

// Public recommendation route with rate limiting
Route::middleware('throttle:sensitive')->post('/recommend', [RecommendationController::class, 'recommend']);

// Cron/Webhook routes (protected with secret token)
Route::get('/cron/send-reminders', function() {
    // Check for secret token
    $secret = request()->query('token');
    $expectedSecret = env('CRON_SECRET_TOKEN', 'change-this-secret-token-in-production');
    
    if (!$secret || $secret !== $expectedSecret) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Invalid or missing token.'
        ], 401);
    }
    
    try {
        Artisan::call('bookings:send-reminders');
        $output = Artisan::output();
        
        return response()->json([
            'success' => true,
            'message' => 'Reminders processed successfully',
            'output' => trim($output)
        ]);
    } catch (\Exception $e) {
        Log::error('Failed to send booking reminders: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error processing reminders: ' . $e->getMessage()
        ], 500);
    }
});

// Protected routes with rate limiting
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/upload-avatar', [AuthController::class, 'uploadAvatar']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Booking routes - specific routes must come before dynamic routes
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    
    // Coordinator routes (for coordinators to see their assigned bookings)
    Route::get('/bookings/my-assignments', [BookingController::class, 'getCoordinatorBookings']);
    
    // Availability checking routes
    Route::get('/bookings/check-availability', [BookingController::class, 'checkAvailability']);
    Route::get('/bookings/available-dates', [BookingController::class, 'getAvailableDates']);
    
    // Admin booking routes (must come before dynamic /bookings/{id} route)
    Route::middleware(['admin', 'throttle:admin'])->group(function () {
        Route::get('/bookings/calendar', [BookingController::class, 'calendar']);
        Route::get('/bookings/export', [BookingController::class, 'export']);
        Route::get('/bookings/past', [BookingController::class, 'getPastEvents']);
        Route::get('/analytics', [BookingController::class, 'analytics']);
        Route::patch('/bookings/status/{id}', [BookingController::class, 'adminUpdateStatus']);
        Route::post('/bookings/{id}/assign-coordinator', [BookingController::class, 'assignCoordinator']);
        Route::delete('/bookings/{id}/unassign-coordinator', [BookingController::class, 'unassignCoordinator']);
        Route::get('/coordinators', [BookingController::class, 'getCoordinators']);
        Route::patch('/bookings/{id}/notes', [BookingController::class, 'updateNotes']);
    });
    
    // Dynamic booking routes (must come after specific routes)
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::patch('/bookings/{id}', [BookingController::class, 'update']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Client testimonial submission
    Route::post('/testimonials/submit', [TestimonialController::class, 'clientSubmit']);

    // Review routes (authenticated users)
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Event preference routes (authenticated users)
    Route::get('/preferences', [EventPreferenceController::class, 'index']);
    Route::post('/preferences', [EventPreferenceController::class, 'store']);
    Route::patch('/preferences', [EventPreferenceController::class, 'update']);
    Route::get('/preferences/summary', [EventPreferenceController::class, 'getSummary']);

    // Admin routes with rate limiting
    Route::middleware(['admin', 'throttle:admin'])->group(function () {
        // User/Coordinator management
        Route::post('/auth/create-coordinator', [AuthController::class, 'createCoordinator']);

        // Client management
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);

        // Package management
        Route::post('/packages', [PackageController::class, 'store']);
        Route::put('/packages/{id}', [PackageController::class, 'update']);
        Route::patch('/packages/{id}', [PackageController::class, 'update']);
        Route::delete('/packages/{id}', [PackageController::class, 'destroy']);
        
        // AI Image Analysis for package creation
        Route::post('/analyze-package-image', [ImageAnalysisController::class, 'analyzePackageImage']);

        // Client preference management (admin)
        Route::get('/clients/{clientId}/preferences/summary', [EventPreferenceController::class, 'getClientSummary']);

        // Contact inquiry management
        Route::get('/contact-inquiries', [ContactController::class, 'index']);
        Route::get('/contact-inquiries/export', [ContactController::class, 'export']);
        Route::patch('/contact-inquiries/{id}/status', [ContactController::class, 'updateStatus']);

        // Venue management
        Route::post('/venues', [VenueController::class, 'store']);
        Route::put('/venues/{id}', [VenueController::class, 'update']);
        Route::patch('/venues/{id}', [VenueController::class, 'update']);
        Route::delete('/venues/{id}', [VenueController::class, 'destroy']);

        // Portfolio management
        Route::post('/portfolio-items', [PortfolioController::class, 'store']);
        Route::put('/portfolio-items/{portfolioItem}', [PortfolioController::class, 'update']);
        Route::patch('/portfolio-items/{portfolioItem}', [PortfolioController::class, 'update']);
        Route::delete('/portfolio-items/{portfolioItem}', [PortfolioController::class, 'destroy']);

        // Testimonial management
        Route::post('/testimonials', [TestimonialController::class, 'store']);
        Route::put('/testimonials/{testimonial}', [TestimonialController::class, 'update']);
        Route::patch('/testimonials/{testimonial}', [TestimonialController::class, 'update']);
        Route::delete('/testimonials/{testimonial}', [TestimonialController::class, 'destroy']);

        // Audit logs (admin only)
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats']);
        Route::get('/audit-logs/{id}', [AuditLogController::class, 'show']);
    });
});
