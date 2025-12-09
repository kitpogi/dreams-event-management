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
        Schema::table('event_packages', function (Blueprint $table) {
            $table->unsignedBigInteger('venue_id')->nullable()->after('package_price');
            // Assuming venues table exists and primary key is id. Adjust if necessary.
            // Check if venues table exists first or just add column.
            // Safe to just add column for now, FK constraint optional but good.
            // $table->foreign('venue_id')->references('id')->on('venues')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_packages', function (Blueprint $table) {
            $table->dropColumn('venue_id');
        });
    }
};
