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
        Schema::create('coordinators', function (Blueprint $table) {
            $table->bigIncrements('coordinator_id');
            $table->string('coordinator_lname');
            $table->string('coordinator_fname');
            $table->string('coordinator_mname')->nullable();
            $table->string('coordinator_email')->unique();
            $table->string('coordinator_contact');
            $table->string('coordinator_address');
            $table->string('coordinator_password');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coordinators');
    }
};


