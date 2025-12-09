<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::create([
            'client_lname' => 'Dela Cruz',
            'client_fname' => 'Juan',
            'client_mname' => 'Santos',
            'client_email' => 'juan.client@example.com',
            'client_contact' => '09171234567',
            'client_address' => 'Quezon City, Philippines',
            'client_password' => Hash::make('password123'),
        ]);

        Client::create([
            'client_lname' => 'Santos',
            'client_fname' => 'Maria',
            'client_mname' => 'Lopez',
            'client_email' => 'maria.client@example.com',
            'client_contact' => '09179876543',
            'client_address' => 'Manila, Philippines',
            'client_password' => Hash::make('password123'),
        ]);
    }
}


