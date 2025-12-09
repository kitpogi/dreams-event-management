<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Get all clients (Admin only)
     */
    public function index(Request $request)
    {
        $query = Client::withCount('bookings')
            ->with(['bookings.eventPackage']);

        // Optional search/filter
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('client_fname', 'like', '%' . $request->search . '%')
                  ->orWhere('client_lname', 'like', '%' . $request->search . '%')
                  ->orWhere('client_email', 'like', '%' . $request->search . '%');
            });
        }

        $clients = $query->get()->map(function ($client) {
            return [
                'id' => $client->client_id,
                'name' => trim(($client->client_fname ?? '') . ' ' . ($client->client_lname ?? '')),
                'email' => $client->client_email,
                'phone' => $client->client_contact,
                'address' => $client->client_address,
                'bookings_count' => $client->bookings_count ?? 0,
            ];
        });

        return response()->json(['data' => $clients]);
    }

    /**
     * Get a specific client (Admin only)
     */
    public function show($id)
    {
        $client = Client::with(['bookings.eventPackage', 'reviews', 'recommendations'])
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $client->client_id,
                'name' => trim(($client->client_fname ?? '') . ' ' . ($client->client_lname ?? '')),
                'email' => $client->client_email,
                'phone' => $client->client_contact,
                'address' => $client->client_address,
                'bookings' => $client->bookings,
                'reviews' => $client->reviews,
                'recommendations' => $client->recommendations,
            ]
        ]);
    }
}

