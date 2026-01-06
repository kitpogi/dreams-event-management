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
            $table->decimal('total_amount', 10, 2)->nullable()->after('guest_count');
            $table->decimal('deposit_amount', 10, 2)->nullable()->after('total_amount');
            $table->boolean('payment_required')->default(true)->after('deposit_amount');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid', 'refunded'])->default('unpaid')->after('payment_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_details', function (Blueprint $table) {
            $table->dropColumn(['total_amount', 'deposit_amount', 'payment_required', 'payment_status']);
        });
    }
};

