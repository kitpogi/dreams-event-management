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
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('tracking_id')->unique();
            $table->string('type', 50);
            $table->string('recipient');
            $table->string('subject');
            $table->enum('status', ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'])->default('queued');
            $table->json('metadata')->nullable();
            $table->json('clicks')->nullable();
            $table->unsignedSmallInteger('open_count')->default(0);
            $table->unsignedSmallInteger('click_count')->default(0);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->string('bounce_type', 50)->nullable();
            $table->text('bounce_message')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamp('bounced_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index('tracking_id');
            $table->index(['type', 'status']);
            $table->index(['recipient', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
