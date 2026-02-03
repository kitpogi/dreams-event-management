<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adds event_duration (in hours) and event_end_time for precise time-slot booking.
     * This enables multiple events on the same day in different time slots.
     */
    public function up(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            // Duration of the event in hours (e.g., 2.5 for 2 hours 30 mins)
            $table->decimal('event_duration', 4, 2)->nullable()->after('event_time')
                ->comment('Duration of the event in hours');

            // Calculated end time for the event
            $table->time('event_end_time')->nullable()->after('event_duration')
                ->comment('End time of the event');

            // Add index for faster time-slot availability queries
            $table->index(['package_id', 'event_date', 'event_time'], 'booking_timeslot_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            $table->dropIndex('booking_timeslot_idx');
            $table->dropColumn(['event_duration', 'event_end_time']);
        });
    }
};
