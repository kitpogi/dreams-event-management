<?php

namespace Database\Seeders;

use App\Models\TeamMember;
use Illuminate\Database\Seeder;

class TeamMemberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $members = [
            [
                'name' => 'Jane Doe',
                'role' => 'Founder & Lead Planner',
                'description' => '10+ years of experience creating magical events.',
                'image' => '/assets/team/jane-doe.jpg',
                'sort_order' => 1,
            ],
            [
                'name' => 'Maria Santos',
                'role' => 'Creative Director',
                'description' => 'Turning visions into stunning realities.',
                'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
                'sort_order' => 2,
            ],
            [
                'name' => 'Ana Cruz',
                'role' => 'Event Coordinator',
                'description' => 'Detail-oriented perfectionist ensuring every event runs smoothly.',
                'image' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800',
                'sort_order' => 3,
            ],
            [
                'name' => 'Ramon Garcia',
                'role' => 'Decor Specialist',
                'description' => 'Transforms venues into dream spaces with creative floral and decor designs.',
                'image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800',
                'sort_order' => 4,
            ]
        ];

        foreach ($members as $member) {
            TeamMember::create($member);
        }
    }
}
