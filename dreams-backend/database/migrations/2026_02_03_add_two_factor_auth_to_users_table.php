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
        Schema::table('users', function (Blueprint $table) {
            // Add 2FA columns if they don't exist
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false)->after('password');
            }
            
            if (!Schema::hasColumn('users', 'two_factor_method')) {
                $table->string('two_factor_method')->nullable()->after('two_factor_enabled');
            }
            
            if (!Schema::hasColumn('users', 'two_factor_secret')) {
                $table->text('two_factor_secret')->nullable()->after('two_factor_method');
            }
            
            if (!Schema::hasColumn('users', 'twoFactorCodes')) {
                $table->json('twoFactorCodes')->nullable()->after('two_factor_secret');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->dropColumn('two_factor_enabled');
            }
            
            if (Schema::hasColumn('users', 'two_factor_method')) {
                $table->dropColumn('two_factor_method');
            }
            
            if (Schema::hasColumn('users', 'two_factor_secret')) {
                $table->dropColumn('two_factor_secret');
            }
            
            if (Schema::hasColumn('users', 'twoFactorCodes')) {
                $table->dropColumn('twoFactorCodes');
            }
        });
    }
};
