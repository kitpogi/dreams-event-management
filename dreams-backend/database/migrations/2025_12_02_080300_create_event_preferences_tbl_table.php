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
        Schema::create('event_preferences', function (Blueprint $table) {
            $table->bigIncrements('preference_id');

            $table->unsignedBigInteger('client_id');

            $table->string('preferred_event_type');
            $table->decimal('preferred_budget', 10, 2);
            $table->string('preferred_theme');
            $table->integer('preferred_guest_count');
            $table->string('preferred_venue');

            $table->timestamps();

            $table->foreign('client_id')
                ->references('client_id')
                ->on('clients')
                ->onDelete('cascade');

            $table->unique('client_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_preferences', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropUnique(['client_id']);
        });

        Schema::dropIfExists('event_preferences');
    }
};


