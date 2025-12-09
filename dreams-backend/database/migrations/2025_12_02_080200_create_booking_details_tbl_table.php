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
        Schema::create('booking_details', function (Blueprint $table) {
            $table->bigIncrements('booking_id');

            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('package_id');

            $table->date('event_date');
            $table->string('event_venue');
            $table->integer('guest_count');
            $table->enum('booking_status', ['Pending', 'Approved', 'Completed', 'Cancelled']);
            $table->text('special_requests')->nullable();

            $table->timestamps();

            $table->foreign('client_id')
                ->references('client_id')
                ->on('clients')
                ->onDelete('cascade');

            $table->foreign('package_id')
                ->references('package_id')
                ->on('event_packages')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropForeign(['package_id']);
        });

        Schema::dropIfExists('booking_details');
    }
};


