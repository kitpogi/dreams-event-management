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
        Schema::create('event_packages', function (Blueprint $table) {
            $table->bigIncrements('package_id');
            $table->string('package_name');
            $table->text('package_description');
            $table->string('package_category');
            $table->decimal('package_price', 10, 2);
            $table->string('package_image')->nullable();
            $table->longText('package_inclusions');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_packages');
    }
};


