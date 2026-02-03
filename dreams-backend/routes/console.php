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

