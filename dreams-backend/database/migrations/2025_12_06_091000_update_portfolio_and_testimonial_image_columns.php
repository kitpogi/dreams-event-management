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
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->text('image_path')->nullable()->change();
        });

        Schema::table('testimonials', function (Blueprint $table) {
            $table->text('avatar_path')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->string('image_path', 255)->nullable()->change();
        });

        Schema::table('testimonials', function (Blueprint $table) {
            $table->string('avatar_path', 255)->nullable()->change();
        });
    }
};


