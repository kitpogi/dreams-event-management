<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'title' => 'Debut Planning',
                'category' => 'Debut',
                'description' => 'Starting from ₱25,000',
                'details' => 'Complete 18th birthday celebration management including cotillion, 18 roses, and candles.',
                'rating' => 4.9,
                'icon' => 'cake',
                'images' => ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800'],
                'link' => '/packages',
                'sort_order' => 1
            ],
            [
                'title' => 'Wedding Events',
                'category' => 'Wedding',
                'description' => 'Starting from ₱50,000',
                'details' => 'Elegant design and seamless coordination for your walk down the aisle.',
                'rating' => 5.0,
                'icon' => 'favorite',
                'images' => ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'],
                'link' => '/packages',
                'sort_order' => 2
            ],
            [
                'title' => 'Birthday Parties',
                'category' => 'Birthday',
                'description' => 'Starting from ₱15,000',
                'details' => 'Themed decor and fun entertainment for all ages and milestones.',
                'rating' => 4.8,
                'icon' => 'celebration',
                'images' => ['https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&q=80&w=800'],
                'link' => '/packages',
                'sort_order' => 3
            ],
            [
                'title' => 'Miss Jimalalud 2026',
                'category' => 'Pageant',
                'description' => 'Professional Pageant Management',
                'details' => 'Stage design, lighting, and coordination for beauty contests.',
                'rating' => 4.9,
                'icon' => 'emoji_events',
                'images' => [
                    '/assets/services/pageants/miss_jimalalud_2026_1.jpg',
                    '/assets/services/pageants/miss_jimalalud_2023.jpg',
                    '/assets/services/pageants/miss_jimalalud_2019.jpg'
                ],
                'link' => '/portfolio',
                'sort_order' => 4
            ],
            [
                'title' => 'Corporate Galas',
                'category' => 'Corporate',
                'description' => 'Starting from ₱40,000',
                'details' => 'Professional events, product launches, and award ceremonies.',
                'rating' => 4.7,
                'icon' => 'business',
                'images' => ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'],
                'link' => '/packages',
                'sort_order' => 5
            ],
            [
                'title' => 'Miss Jimalalud 2023',
                'category' => 'Pageant',
                'description' => 'Spectacular Event Production',
                'details' => 'Full event production services for the 2023 pageant.',
                'rating' => 4.9,
                'icon' => 'star',
                'images' => ['/assets/services/pageants/miss_jimalalud_2023.jpg'],
                'link' => '/portfolio',
                'sort_order' => 6
            ]
        ];

        foreach ($services as $serviceData) {
            Service::create($serviceData);
        }
    }
}
