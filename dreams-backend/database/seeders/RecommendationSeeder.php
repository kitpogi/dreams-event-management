<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\EventPackage;
use App\Models\Recommendation;
use Illuminate\Database\Seeder;

class RecommendationSeeder extends Seeder
{
    public function run(): void
    {
        $client = Client::first();
        $packages = EventPackage::all();

        if (!$client || $packages->isEmpty()) {
            return;
        }

        Recommendation::create([
            'client_id' => $client->client_id,
            'package_id' => $packages[0]->package_id,
            'score' => 95.0,
            'reason' => 'Matches preferred event type and budget.',
        ]);

        if ($packages->count() > 1) {
            Recommendation::create([
                'client_id' => $client->client_id,
                'package_id' => $packages[1]->package_id,
                'score' => 88.0,
                'reason' => 'Within budget and suitable for guest count.',
            ]);
        }
    }
}


