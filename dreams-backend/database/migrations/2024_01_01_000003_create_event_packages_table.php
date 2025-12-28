<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Legacy migration disabled: event_packages table replaced by event_package_tbl (capstone schema)
    public function up(): void
    {
        // Intentionally left blank
    }

    public function down(): void
    {
        // Intentionally left blank
    }
};

