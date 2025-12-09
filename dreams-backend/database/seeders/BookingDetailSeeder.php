<?php

namespace Database\Seeders;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use Illuminate\Database\Seeder;

class BookingDetailSeeder extends Seeder
{
    public function run(): void
    {
        $client = Client::first();
        $packages = EventPackage::all();

        if (!$client || $packages->isEmpty()) {
            return;
        }

        BookingDetail::create([
            'client_id' => $client->client_id,
            'package_id' => $packages[0]->package_id,
            'event_date' => now()->addMonths(1)->format('Y-m-d'),
            'event_venue' => 'Manila Hotel Ballroom',
            'guest_count' => 150,
            'booking_status' => 'Pending',
            'special_requests' => 'Include vegetarian options and extended photo coverage.',
        ]);

        if ($packages->count() > 1) {
            BookingDetail::create([
                'client_id' => $client->client_id,
                'package_id' => $packages[1]->package_id,
                'event_date' => now()->addMonths(2)->format('Y-m-d'),
                'event_venue' => 'Garden Venue',
                'guest_count' => 80,
                'booking_status' => 'Approved',
                'special_requests' => 'Outdoor ceremony with backup indoor space.',
            ]);
        }
    }
}


