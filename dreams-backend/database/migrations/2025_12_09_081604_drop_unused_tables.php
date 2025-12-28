<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Drop unused tables: reviews, coordinators, event_preferences, package_images
     */
    public function up(): void
    {
        // Drop reviews table (has foreign keys)
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropForeign(['client_id']);
                $table->dropForeign(['package_id']);
            });
            Schema::dropIfExists('reviews');
        }

        // Drop event_preferences table (has foreign key and unique constraint)
        if (Schema::hasTable('event_preferences')) {
            Schema::table('event_preferences', function (Blueprint $table) {
                $table->dropForeign(['client_id']);
                $table->dropUnique(['client_id']);
            });
            Schema::dropIfExists('event_preferences');
        }

        // Drop coordinators table (no foreign keys)
        Schema::dropIfExists('coordinators');

        // Drop package_images table (if exists, legacy migration was disabled)
        Schema::dropIfExists('package_images');

        // Drop legacy bookings table (if exists, migration was disabled)
        Schema::dropIfExists('bookings');
    }

    /**
     * Reverse the migrations.
     * Note: This migration cannot be fully reversed as we don't have the exact schema.
     * These tables should not be recreated as they are no longer used.
     */
    public function down(): void
    {
        // Intentionally left blank - these tables are no longer needed
        // If you need to reverse, you would need to recreate the original migrations
    }
};
