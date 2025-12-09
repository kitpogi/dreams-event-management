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
        Schema::table('contact_inquiries', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('mobile_number')->nullable()->after('email');
            $table->date('date_of_event')->nullable()->after('event_type');
            $table->string('preferred_venue')->nullable()->after('date_of_event');
            $table->decimal('budget', 10, 2)->nullable()->after('preferred_venue');
            $table->integer('estimated_guests')->nullable()->after('budget');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_inquiries', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'mobile_number',
                'date_of_event',
                'preferred_venue',
                'budget',
                'estimated_guests',
            ]);
        });
    }
};
