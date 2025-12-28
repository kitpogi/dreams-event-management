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
        Schema::table('event_packages', function (Blueprint $table) {
            $table->integer('capacity')->nullable()->after('package_price');
        });

        // Extract capacity from package_inclusions and populate the new column
        $packages = DB::table('event_packages')->get();
        
        foreach ($packages as $package) {
            if ($package->package_inclusions) {
                // Extract capacity from string like "Capacity: 300; Theme: elegant..."
                if (preg_match('/Capacity:\s*(\d+)/', $package->package_inclusions, $matches)) {
                    DB::table('event_packages')
                        ->where('package_id', $package->package_id)
                        ->update(['capacity' => (int)$matches[1]]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_packages', function (Blueprint $table) {
            $table->dropColumn('capacity');
        });
    }
};

