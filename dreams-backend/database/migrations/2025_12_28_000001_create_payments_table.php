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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->string('payment_intent_id')->unique()->nullable(); // PayMongo payment intent ID
            $table->string('payment_method_id')->nullable(); // PayMongo payment method ID
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('PHP');
            $table->enum('payment_method', ['card', 'gcash', 'maya', 'qr_ph', 'bank_transfer', 'otc'])->nullable();
            $table->enum('status', ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->string('transaction_id')->nullable(); // PayMongo transaction ID
            $table->json('metadata')->nullable(); // Store additional payment data
            $table->text('failure_reason')->nullable(); // Reason for failure if payment fails
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('booking_id')
                ->references('booking_id')
                ->on('booking_details')
                ->onDelete('cascade');

            $table->index('booking_id');
            $table->index('payment_intent_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

