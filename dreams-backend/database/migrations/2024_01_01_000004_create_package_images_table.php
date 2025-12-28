<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Legacy migration disabled: package_images table tied to legacy event_packages
    public function up(): void
    {
        // Intentionally left blank
    }

    public function down(): void
    {
        // Intentionally left blank
    }
};

