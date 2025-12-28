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

