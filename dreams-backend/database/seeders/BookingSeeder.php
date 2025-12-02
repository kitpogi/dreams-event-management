<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\EventPackage;
use App\Models\User;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $clients = User::where('role', 'client')->get();
        $packages = EventPackage::all();

        if ($clients->isEmpty() || $packages->isEmpty()) {
            return;
        }

        $weddingPackages = $packages->where('type', 'wedding');
        $birthdayPackages = $packages->where('type', 'birthday');
        $debutPackages = $packages->where('type', 'debut');
        $pageantPackages = $packages->where('type', 'pageant');

        $bookings = [
            [
                'user_id' => $clients[0]->id,
                'package_id' => $weddingPackages->first()->id,
                'event_date' => now()->addMonths(2)->format('Y-m-d'),
                'event_time' => '14:00:00',
                'number_of_guests' => 200,
                'special_requests' => 'Please include vegetarian options in the menu.',
                'status' => 'pending',
            ],
            [
                'user_id' => $clients[0]->id,
                'package_id' => $birthdayPackages->first()->id,
                'event_date' => now()->addMonths(1)->format('Y-m-d'),
                'event_time' => '15:00:00',
                'number_of_guests' => 40,
                'special_requests' => 'Need a birthday cake for 10-year-old.',
                'status' => 'confirmed',
            ],
        ];

        if ($clients->count() > 1 && $debutPackages->isNotEmpty()) {
            $bookings[] = [
                'user_id' => $clients[1]->id,
                'package_id' => $debutPackages->first()->id,
                'event_date' => now()->addMonths(3)->format('Y-m-d'),
                'event_time' => '18:00:00',
                'number_of_guests' => 180,
                'special_requests' => 'Need 18 roses and candles ceremony setup.',
                'status' => 'pending',
            ];
        }

        if ($clients->count() > 1 && $pageantPackages->isNotEmpty()) {
            $bookings[] = [
                'user_id' => $clients[1]->id,
                'package_id' => $pageantPackages->first()->id,
                'event_date' => now()->addMonths(4)->format('Y-m-d'),
                'event_time' => '19:00:00',
                'number_of_guests' => 350,
                'special_requests' => 'Professional stage lighting required.',
                'status' => 'confirmed',
            ];
        }

        if ($clients->count() > 2 && $weddingPackages->count() > 1) {
            $bookings[] = [
                'user_id' => $clients[2]->id,
                'package_id' => $weddingPackages->skip(1)->first()->id,
                'event_date' => now()->addMonths(5)->format('Y-m-d'),
                'event_time' => '16:00:00',
                'number_of_guests' => 120,
                'special_requests' => 'Outdoor ceremony preferred.',
                'status' => 'pending',
            ];
        }

        foreach ($bookings as $booking) {
            $package = EventPackage::find($booking['package_id']);
            if ($package) {
                Booking::create([
                    'user_id' => $booking['user_id'],
                    'package_id' => $booking['package_id'],
                    'event_date' => $booking['event_date'],
                    'event_time' => $booking['event_time'],
                    'number_of_guests' => $booking['number_of_guests'],
                    'special_requests' => $booking['special_requests'],
                    'status' => $booking['status'],
                    'total_price' => $package->price,
                ]);
            }
        }
    }
}

