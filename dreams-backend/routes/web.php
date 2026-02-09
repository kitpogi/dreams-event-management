<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Dreams Event Management API',
        'version' => '1.0.0',
    ]);
});

// Redirect frontend SPA routes that accidentally hit the backend
// This happens when FRONTEND_URL points to the backend (e.g. via ngrok)
Route::get('/payment/confirm/{paymentId}', function ($paymentId) {
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
    $backendUrl = env('APP_URL', 'http://localhost:8000');

    // If FRONTEND_URL is the same as the backend (e.g. both via ngrok),
    // redirect to localhost:3000 instead to avoid a redirect loop
    if (rtrim($frontendUrl, '/') === rtrim(url('/'), '/') || rtrim($frontendUrl, '/') === rtrim($backendUrl, '/')) {
        return redirect('http://localhost:3000/payment/confirm/' . $paymentId);
    }

    return redirect($frontendUrl . '/payment/confirm/' . $paymentId);
});

