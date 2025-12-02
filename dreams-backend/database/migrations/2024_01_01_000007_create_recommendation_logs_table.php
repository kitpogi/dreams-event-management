<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('type')->nullable();
            $table->decimal('budget', 10, 2)->nullable();
            $table->integer('guests')->nullable();
            $table->string('theme')->nullable();
            $table->json('preferences')->nullable();
            $table->json('results')->nullable(); // Store top 5 packages with scores
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_logs');
    }
};

