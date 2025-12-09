<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'coordinator'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client', 'coordinator') DEFAULT 'client'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove coordinator from enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client') DEFAULT 'client'");
    }
};

