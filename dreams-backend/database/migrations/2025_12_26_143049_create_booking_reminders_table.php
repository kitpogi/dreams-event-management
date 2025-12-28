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
        Schema::create('booking_reminders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->enum('reminder_type', ['1_week', '1_day']); // Type of reminder
            $table->date('reminder_date'); // Date when reminder was sent
            $table->date('event_date'); // Event date for reference
            $table->timestamps();

            $table->foreign('booking_id')
                ->references('booking_id')
                ->on('booking_details')
                ->onDelete('cascade');

            // Prevent duplicate reminders for same booking and type
            $table->unique(['booking_id', 'reminder_type', 'reminder_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_reminders');
    }
};
