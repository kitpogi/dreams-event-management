<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update admin user
        User::updateOrCreate(
            ['email' => 'admin@dreamsevents.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'phone' => '+63 912 345 6789',
                'role' => 'admin',
            ]
        );

        // Create or update coordinator user
        User::updateOrCreate(
            ['email' => 'coordinator@dreamsevents.com'],
            [
                'name' => 'Event Coordinator',
                'password' => Hash::make('coordinator123'),
                'phone' => '+63 912 345 6799',
                'role' => 'coordinator',
            ]
        );

        // Create or update sample client users
        $clients = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+63 912 345 6790',
                'role' => 'client',
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+63 912 345 6791',
                'role' => 'client',
            ],
            [
                'name' => 'Maria Garcia',
                'email' => 'maria@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+63 912 345 6792',
                'role' => 'client',
            ],
        ];

        foreach ($clients as $client) {
            User::updateOrCreate(
                ['email' => $client['email']],
                $client
            );
        }
    }
}

