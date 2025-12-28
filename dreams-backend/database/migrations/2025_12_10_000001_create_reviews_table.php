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
        if (!Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table) {
                $table->bigIncrements('review_id');

                $table->unsignedBigInteger('client_id');
                $table->unsignedBigInteger('package_id');
                $table->unsignedBigInteger('booking_id')->nullable(); // Link to completed booking

                $table->tinyInteger('rating');
                $table->text('review_message')->nullable();

                $table->timestamps();

                $table->foreign('client_id')
                    ->references('client_id')
                    ->on('clients')
                    ->onDelete('cascade');

                $table->foreign('package_id')
                    ->references('package_id')
                    ->on('event_packages')
                    ->onDelete('cascade');

                $table->foreign('booking_id')
                    ->references('booking_id')
                    ->on('booking_details')
                    ->onDelete('cascade');

                // Ensure one review per booking
                $table->unique('booking_id');
            });
        } else {
            // If table exists, just add booking_id column if missing
            if (!Schema::hasColumn('reviews', 'booking_id')) {
                Schema::table('reviews', function (Blueprint $table) {
                    $table->unsignedBigInteger('booking_id')->nullable()->after('package_id');
                    $table->foreign('booking_id')
                        ->references('booking_id')
                        ->on('booking_details')
                        ->onDelete('cascade');
                    $table->unique('booking_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropForeign(['client_id']);
                $table->dropForeign(['package_id']);
                if (Schema::hasColumn('reviews', 'booking_id')) {
                    $table->dropForeign(['booking_id']);
                    $table->dropUnique(['booking_id']);
                }
            });
            Schema::dropIfExists('reviews');
        }
    }
};

