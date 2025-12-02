<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\RecommendationController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Package routes (public read, admin write)
    Route::get('/packages', [PackageController::class, 'index']);
    Route::get('/packages/{id}', [PackageController::class, 'show']);

    // Booking routes
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::patch('/bookings/{id}', [BookingController::class, 'update']);

    // Recommendation route
    Route::post('/recommend', [RecommendationController::class, 'recommend']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        // Package management
        Route::post('/packages', [PackageController::class, 'store']);
        Route::put('/packages/{id}', [PackageController::class, 'update']);
        Route::patch('/packages/{id}', [PackageController::class, 'update']);
        Route::delete('/packages/{id}', [PackageController::class, 'destroy']);

        // Booking management
        Route::patch('/bookings/status/{id}', [BookingController::class, 'adminUpdateStatus']);
    });
});
