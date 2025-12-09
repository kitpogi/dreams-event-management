<?php

namespace Database\Seeders;

use App\Models\EventPackage;
use Illuminate\Database\Seeder;

class EventPackageCapstoneSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'package_name' => 'Royal Wedding Package',
                'package_description' => 'Luxurious wedding package with elegant decorations, premium catering, photography, and full coordination.',
                'package_category' => 'wedding',
                'package_price' => 150000.00,
                'package_image' => null,
                'package_inclusions' => 'Full coordination, premium catering, photography, floral arrangements, sounds and lights',
            ],
            [
                'package_name' => 'Garden Wedding Package',
                'package_description' => 'Romantic outdoor wedding with garden setup, floral designs, and intimate ambiance.',
                'package_category' => 'wedding',
                'package_price' => 80000.00,
                'package_image' => null,
                'package_inclusions' => 'Garden venue setup, catering, basic photo coverage, host',
            ],
            [
                'package_name' => 'Kids Birthday Party',
                'package_description' => 'Fun-filled kids party with games, mascot, and themed decorations.',
                'package_category' => 'birthday',
                'package_price' => 30000.00,
                'package_image' => null,
                'package_inclusions' => 'Host, games, prizes, mascot, simple catering',
            ],
            [
                'package_name' => 'Debut Princess Package',
                'package_description' => 'Elegant debut celebration with 18 roses and candles, special stage, and premium catering.',
                'package_category' => 'debut',
                'package_price' => 120000.00,
                'package_image' => null,
                'package_inclusions' => 'Full program, 18 roses & candles, catering, stage and lights',
            ],
        ];

        foreach ($packages as $package) {
            EventPackage::create($package);
        }
    }
}


