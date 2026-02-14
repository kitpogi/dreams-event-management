<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('event_packages', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false)->after('package_inclusions');
            $table->boolean('is_active')->default(true)->after('is_featured');
            $table->index('is_featured', 'event_packages_is_featured_index');
            $table->index('is_active', 'event_packages_is_active_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_packages', function (Blueprint $table) {
            $table->dropIndex('event_packages_is_featured_index');
            $table->dropIndex('event_packages_is_active_index');
            $table->dropColumn(['is_featured', 'is_active']);
        });
    }
};
