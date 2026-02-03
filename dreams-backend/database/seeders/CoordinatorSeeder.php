<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CoordinatorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if coordinator account already exists
        $coordinator = User::where('email', 'coordinator@dreams.com')->first();

        if (!$coordinator) {
            User::create([
                'name' => 'Event Coordinator',
                'email' => 'coordinator@dreams.com',
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'email_verified_at' => now(),
            ]);
            $this->command->info('Coordinator account created: coordinator@dreams.com / password123');
        } else {
            $this->command->info('Coordinator account already exists.');
        }
    }
}
