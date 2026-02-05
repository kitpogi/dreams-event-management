<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\EmailTrackingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\EventPreferenceController;
use App\Http\Controllers\Api\PushNotificationController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\ImageAnalysisController;
use App\Http\Controllers\Api\MetricsController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\BookingAttachmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\TeamMemberController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

// Health check endpoints (no auth required)
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'check']);
    Route::get('/detailed', [HealthController::class, 'detailed']);
    Route::get('/ready', [HealthController::class, 'ready']);
    Route::get('/live', [HealthController::class, 'live']);
});

// Metrics endpoints (protected by token for production)
Route::prefix('metrics')->group(function () {
    Route::get('/', [MetricsController::class, 'prometheus']);
    Route::get('/json', [MetricsController::class, 'json']);
    Route::get('/summary', [MetricsController::class, 'summary']);
    Route::get('/business', [MetricsController::class, 'business']);
    Route::get('/database', [MetricsController::class, 'database']);
    Route::get('/{name}', [MetricsController::class, 'show']);
});

// Public routes with rate limiting
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);
    Route::post('/auth/facebook', [AuthController::class, 'facebookLogin']);
    Route::post('/auth/facebook/callback', [AuthController::class, 'facebookCallback']);
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
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/team-members', [TeamMemberController::class, 'index']);
    Route::get('/public-stats', [BookingController::class, 'getPublicStats']);

    // Public review viewing
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);
    Route::get('/packages/{packageId}/reviews', [ReviewController::class, 'getPackageReviews']);
});

// Public recommendation route with rate limiting
Route::middleware('throttle:sensitive')->post('/recommend', [RecommendationController::class, 'recommend']);

// Payment webhook (public, but protected by signature verification)
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

// Cron/Webhook routes (protected with secret token)
Route::get('/cron/send-reminders', function () {
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

// Cron route to mark completed bookings (run daily after event dates)
Route::get('/cron/mark-completed', function () {
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
        // Get days parameter (optional, default 0)
        $days = (int) request()->query('days', 0);

        Artisan::call('bookings:mark-completed', ['--days' => $days]);
        $output = Artisan::output();

        return response()->json([
            'success' => true,
            'message' => 'Completed bookings processed successfully',
            'output' => trim($output)
        ]);
    } catch (\Exception $e) {
        Log::error('Failed to mark completed bookings: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Error processing completed bookings: ' . $e->getMessage()
        ], 500);
    }
});

// Broadcasting authentication for WebSocket connections
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Protected routes with rate limiting
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/revoke', [AuthController::class, 'revoke']);
    Route::post('/auth/revoke-all', [AuthController::class, 'revokeAll']);
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
        Route::get('/bookings/availability-details', [BookingController::class, 'checkAvailabilityDetails']);
        Route::get('/analytics', [BookingController::class, 'analytics']);
        Route::patch('/bookings/status/{id}', [BookingController::class, 'adminUpdateStatus']);
        Route::post('/bookings/{id}/assign-coordinator', [BookingController::class, 'assignCoordinator']);
        Route::delete('/bookings/{id}/unassign-coordinator', [BookingController::class, 'unassignCoordinator']);
        Route::get('/coordinators', [BookingController::class, 'getCoordinators']);
        Route::patch('/bookings/{id}/notes', [BookingController::class, 'updateNotes']);
        Route::post('/bookings/bulk-status', [BookingController::class, 'bulkUpdateStatus']);
    });

    // Booking attachment routes (mood boards/inspiration photos)
    Route::get('/bookings/{bookingId}/attachments', [BookingAttachmentController::class, 'index']);
    Route::post('/bookings/{bookingId}/attachments', [BookingAttachmentController::class, 'upload']);
    Route::delete('/bookings/{bookingId}/attachments/{fileIndex}', [BookingAttachmentController::class, 'delete']);

    // Dynamic booking routes (must come after specific routes)
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::patch('/bookings/{id}', [BookingController::class, 'update']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);


    // Payment routes
    Route::post('/payments/create-intent', [PaymentController::class, 'createPaymentIntent']);
    Route::post('/payments/attach-method', [PaymentController::class, 'attachPaymentMethod']);
    Route::get('/payments/{id}/status', [PaymentController::class, 'getPaymentStatus']);
    Route::get('/bookings/{bookingId}/payments', [PaymentController::class, 'getBookingPayments']);
    Route::post('/bookings/{bookingId}/payment-link', [PaymentController::class, 'createPaymentLink']);

    // Invoice routes
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);
    Route::post('/bookings/{bookingId}/invoices', [InvoiceController::class, 'generate']);

    // Task management routes
    Route::get('/bookings/{bookingId}/tasks', [TaskController::class, 'index']);
    Route::post('/bookings/{bookingId}/tasks', [TaskController::class, 'store']);
    Route::patch('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

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

    // Notification routes (authenticated users)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/statistics', [NotificationController::class, 'statistics']);
        Route::get('/preferences', [NotificationController::class, 'getPreferences']);
        Route::put('/preferences', [NotificationController::class, 'updatePreferences']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/', [NotificationController::class, 'destroyAll']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/{id}/unread', [NotificationController::class, 'markAsUnread']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    // Push notification routes (authenticated users)
    Route::prefix('push')->group(function () {
        Route::post('/register', [PushNotificationController::class, 'registerDevice']);
        Route::delete('/unregister', [PushNotificationController::class, 'unregisterDevice']);
        Route::get('/devices', [PushNotificationController::class, 'getDevices']);
        Route::delete('/devices', [PushNotificationController::class, 'clearDevices']);
        Route::post('/subscribe', [PushNotificationController::class, 'subscribe']);
        Route::post('/unsubscribe', [PushNotificationController::class, 'unsubscribe']);
        Route::post('/test', [PushNotificationController::class, 'sendTest']);
        Route::get('/status', [PushNotificationController::class, 'status']);
    });

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
        Route::post('/contact-inquiries/{id}/reply', [ContactController::class, 'reply']);
        Route::delete('/contact-inquiries/bulk', [ContactController::class, 'bulkDelete']);

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

        // Service management (admin)
        Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::patch('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        // Team Members management (admin)
        Route::get('/admin/team-members', [TeamMemberController::class, 'adminIndex']);
        Route::post('/team-members', [TeamMemberController::class, 'store']);
        Route::put('/team-members/{teamMember}', [TeamMemberController::class, 'update']);
        Route::patch('/team-members/{teamMember}', [TeamMemberController::class, 'update']);
        Route::delete('/team-members/{teamMember}', [TeamMemberController::class, 'destroy']);

        // Audit logs (admin only)
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats']);
        Route::get('/audit-logs/{id}', [AuditLogController::class, 'show']);

        // Email tracking statistics (admin only)
        Route::prefix('email')->group(function () {
            Route::get('/stats', [EmailTrackingController::class, 'getStatistics']);
            Route::get('/stats/by-type', [EmailTrackingController::class, 'getStatsByType']);
            Route::get('/stats/daily', [EmailTrackingController::class, 'getDailyStats']);
            Route::get('/logs', [EmailTrackingController::class, 'getLogs']);
            Route::post('/{trackingId}/retry', [EmailTrackingController::class, 'retry']);
        });

        // Webhook management (admin only)
        Route::prefix('webhooks')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\WebhookController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\WebhookController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\WebhookController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\WebhookController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\WebhookController::class, 'destroy']);
            Route::post('/{id}/test', [\App\Http\Controllers\Api\WebhookController::class, 'test']);
            Route::get('/{id}/deliveries', [\App\Http\Controllers\Api\WebhookController::class, 'deliveries']);
            Route::post('/deliveries/{deliveryId}/retry', [\App\Http\Controllers\Api\WebhookController::class, 'retryDelivery']);
        });

        // Push notification management (admin only)
        Route::prefix('push')->group(function () {
            Route::post('/send', [PushNotificationController::class, 'adminSend']);
            Route::post('/broadcast', [PushNotificationController::class, 'adminBroadcast']);
        });
    });
});

// Email tracking public endpoints (no auth - tracking pixels and redirects)
Route::prefix('email/track')->group(function () {
    Route::get('/open/{trackingId}', [EmailTrackingController::class, 'trackOpen']);
    Route::get('/click/{trackingId}', [EmailTrackingController::class, 'trackClick']);
});

// Email provider webhook (protected by signature verification)
Route::post('/email/webhook', [EmailTrackingController::class, 'handleWebhook']);
