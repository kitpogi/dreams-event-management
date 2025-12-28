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
        Schema::create('reviews', function (Blueprint $table) {
            $table->bigIncrements('review_id');

            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('package_id');

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
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropForeign(['package_id']);
        });

        Schema::dropIfExists('reviews');
    }
};


