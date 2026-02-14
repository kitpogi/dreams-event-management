<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Schedule booking reminders to run daily at 9 AM
Schedule::command('bookings:send-reminders')
    ->dailyAt('09:00')
    ->timezone('Asia/Manila')
    ->withoutOverlapping();

// Schedule auto-completion of bookings to run daily at 11:59 PM
// This marks approved bookings as completed after their event date has passed
Schedule::command('bookings:mark-completed')
    ->dailyAt('23:59')
    ->timezone('Asia/Manila')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/mark-completed.log'));

// Schedule password expiration check to run daily at midnight
// Marks users' passwords as expired if they haven't been changed within the expiration period
Schedule::command('passwords:mark-expired')
    ->daily()
    ->timezone('Asia/Manila')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/password-expiration.log'));

// Schedule API key expiration check to run daily
// Deactivates API keys that have passed their expiration date
Schedule::command('api-keys:deactivate-expired')
    ->daily()
    ->timezone('Asia/Manila')
    ->withoutOverlapping();

// Schedule API key usage log cleanup to run weekly on Sundays
// Removes logs older than 90 days to prevent database bloat
Schedule::command('api-keys:cleanup-logs --days=90')
    ->weekly()
    ->sundays()
    ->at('02:00')
    ->timezone('Asia/Manila')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/api-key-cleanup.log'));

// Schedule auto-cancellation of expired pending bookings that have no payments
// This runs every hour and cancels bookings older than 24 hours (default)
Schedule::command('bookings:cancel-expired --hours=24')
    ->hourly()
    ->timezone('Asia/Manila')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/booking-auto-cancellation.log'));
