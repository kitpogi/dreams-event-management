<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Http\Resources\ClientResource;
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

        $clients = $query->get();

        return response()->json(['data' => ClientResource::collection($clients)]);
    }

    /**
     * Get a specific client (Admin only)
     */
    public function show($id)
    {
        $client = Client::with(['bookings.eventPackage', 'reviews', 'recommendations'])
            ->findOrFail($id);

        return response()->json(['data' => new ClientResource($client)]);
    }
}

