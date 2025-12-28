<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ClientService;
use App\Services\PreferenceSummaryService;
use App\Models\EventPreference;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventPreferenceController extends Controller
{
    protected $clientService;
    protected $preferenceSummaryService;

    public function __construct(ClientService $clientService, PreferenceSummaryService $preferenceSummaryService)
    {
        $this->clientService = $clientService;
        $this->preferenceSummaryService = $preferenceSummaryService;
    }

    /**
     * Get preferences for authenticated user
     */
    public function index(Request $request)
    {
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client) {
            return response()->json([
                'message' => 'Client record not found'
            ], 404);
        }

        $preference = EventPreference::where('client_id', $client->client_id)->first();

        if (!$preference) {
            return response()->json([
                'data' => null,
                'message' => 'No preferences found'
            ]);
        }

        return response()->json(['data' => $preference]);
    }

    /**
     * Store or update preferences for authenticated user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'theme' => 'nullable|string|max:255',
            'guests' => 'nullable|integer|min:1',
            'venue' => 'nullable|string|max:255',
            'preferences' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $client = $this->clientService->findOrCreateFromUser($request->user());

        $preference = $this->preferenceSummaryService->storePreferences(
            $client,
            $request->only(['type', 'budget', 'theme', 'guests', 'venue', 'preferences']),
            $request->user()->id
        );

        return response()->json([
            'data' => $preference,
            'message' => 'Preferences saved successfully'
        ], 201);
    }

    /**
     * Get preference summary for authenticated user
     */
    public function getSummary(Request $request)
    {
        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client) {
            return response()->json([
                'message' => 'Client record not found'
            ], 404);
        }

        $summary = $this->preferenceSummaryService->generateSummary($client);

        return response()->json(['data' => $summary]);
    }

    /**
     * Get preference summary for a specific client (admin only)
     */
    public function getClientSummary(Request $request, $clientId)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $client = Client::findOrFail($clientId);
        $summary = $this->preferenceSummaryService->generateSummary($client);

        return response()->json(['data' => $summary]);
    }

    /**
     * Update preferences
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|string|max:255',
            'budget' => 'sometimes|numeric|min:0',
            'theme' => 'sometimes|string|max:255',
            'guests' => 'sometimes|integer|min:1',
            'venue' => 'sometimes|string|max:255',
            'preferences' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $client = $this->clientService->getByUserEmail($request->user()->email);
        if (!$client) {
            return response()->json([
                'message' => 'Client record not found'
            ], 404);
        }

        $preference = $this->preferenceSummaryService->storePreferences(
            $client,
            $request->only(['type', 'budget', 'theme', 'guests', 'venue', 'preferences']),
            $request->user()->id
        );

        return response()->json([
            'data' => $preference,
            'message' => 'Preferences updated successfully'
        ]);
    }
}

