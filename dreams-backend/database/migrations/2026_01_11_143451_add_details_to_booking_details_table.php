<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            $table->string('event_type')->nullable()->after('guest_count');
            $table->string('theme')->nullable()->after('event_type');
            $table->string('budget_range')->nullable()->after('theme');
            $table->string('alternate_contact')->nullable()->after('budget_range');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            $table->dropColumn(['event_type', 'theme', 'budget_range', 'alternate_contact']);
        });
    }
};
