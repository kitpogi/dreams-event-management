<?php

namespace Database\Seeders;

use App\Models\EventPackage;
use App\Models\Venue;
use Illuminate\Database\Seeder;

class EventPackageSeeder extends Seeder
{
    public function run(): void
    {
        $venues = Venue::all();
        
        $packages = [
            // Wedding Packages
            [
                'name' => 'Royal Wedding Package',
                'description' => 'A luxurious wedding package featuring elegant decorations, premium catering, professional photography, and full event coordination. Perfect for couples dreaming of a fairy-tale wedding.',
                'price' => 150000.00,
                'capacity' => 300,
                'venue_id' => $venues[0]->id,
                'type' => 'wedding',
                'theme' => 'elegant',
                'is_featured' => true,
            ],
            [
                'name' => 'Garden Wedding Package',
                'description' => 'A romantic outdoor wedding package with garden decorations, floral arrangements, and intimate setting. Includes catering and photography services.',
                'price' => 80000.00,
                'capacity' => 150,
                'venue_id' => $venues[1]->id,
                'type' => 'wedding',
                'theme' => 'romantic',
                'is_featured' => true,
            ],
            
            // Debut Packages
            [
                'name' => 'Princess Debut Package',
                'description' => 'Complete debut celebration package with elegant ballroom setup, 18 roses and candles ceremony, professional DJ, and full catering service.',
                'price' => 120000.00,
                'capacity' => 250,
                'venue_id' => $venues[0]->id,
                'type' => 'debut',
                'theme' => 'elegant',
                'is_featured' => false,
            ],
            [
                'name' => 'Modern Debut Package',
                'description' => 'Contemporary debut package with modern decorations, LED lighting, sound system, and buffet catering. Perfect for a trendy celebration.',
                'price' => 90000.00,
                'capacity' => 200,
                'venue_id' => $venues[2]->id,
                'type' => 'debut',
                'theme' => 'modern',
                'is_featured' => false,
            ],
            
            // Birthday Packages
            [
                'name' => 'Kids Birthday Party Package',
                'description' => 'Fun-filled birthday party package with themed decorations, party games, entertainment, and kid-friendly menu. Includes cake and party favors.',
                'price' => 30000.00,
                'capacity' => 50,
                'venue_id' => $venues[1]->id,
                'type' => 'birthday',
                'theme' => 'fun',
                'is_featured' => false,
            ],
            [
                'name' => 'Adult Birthday Celebration',
                'description' => 'Sophisticated birthday celebration package with elegant setup, premium catering, bar service, and entertainment. Perfect for milestone birthdays.',
                'price' => 60000.00,
                'capacity' => 100,
                'venue_id' => $venues[2]->id,
                'type' => 'birthday',
                'theme' => 'sophisticated',
                'is_featured' => false,
            ],
            
            // Pageant Packages
            [
                'name' => 'Beauty Pageant Package',
                'description' => 'Complete pageant event package with stage setup, professional lighting, sound system, backdrop, and full event coordination.',
                'price' => 200000.00,
                'capacity' => 400,
                'venue_id' => $venues[0]->id,
                'type' => 'pageant',
                'theme' => 'glamorous',
                'is_featured' => true,
            ],
            [
                'name' => 'Talent Show Package',
                'description' => 'Professional talent show package with stage, lighting, sound equipment, and event management. Ideal for competitions and showcases.',
                'price' => 100000.00,
                'capacity' => 250,
                'venue_id' => $venues[2]->id,
                'type' => 'pageant',
                'theme' => 'professional',
                'is_featured' => false,
            ],
        ];

        foreach ($packages as $package) {
            EventPackage::create($package);
        }
    }
}

