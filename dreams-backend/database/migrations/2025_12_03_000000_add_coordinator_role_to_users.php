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
        // For SQLite (testing), we skip the modification as it doesn't support MODIFY COLUMN
        // For MySQL/MariaDB, we can use MODIFY COLUMN
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client', 'coordinator') DEFAULT 'client'");
        }
        // SQLite will accept any string value, validation happens at application level
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For SQLite (testing), we skip the rollback
        // For MySQL/MariaDB, revert back to original ENUM values
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client') DEFAULT 'client'");
        }
    }
};

