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
        if (!Schema::hasTable('event_preferences')) {
            Schema::create('event_preferences', function (Blueprint $table) {
                $table->bigIncrements('preference_id');

                $table->unsignedBigInteger('client_id');
                $table->unsignedBigInteger('user_id')->nullable(); // Link to users table for authenticated users

                $table->string('preferred_event_type')->nullable();
                $table->decimal('preferred_budget', 10, 2)->nullable();
                $table->string('preferred_theme')->nullable();
                $table->integer('preferred_guest_count')->nullable();
                $table->string('preferred_venue')->nullable();
                $table->json('preferences')->nullable(); // Store array of preference keywords

                $table->timestamps();

                $table->foreign('client_id')
                    ->references('client_id')
                    ->on('clients')
                    ->onDelete('cascade');

                // One preference record per client
                $table->unique('client_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('event_preferences')) {
            Schema::table('event_preferences', function (Blueprint $table) {
                $table->dropForeign(['client_id']);
                $table->dropUnique(['client_id']);
            });
            Schema::dropIfExists('event_preferences');
        }
    }
};

