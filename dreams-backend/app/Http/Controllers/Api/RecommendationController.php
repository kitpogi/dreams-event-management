<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecommendationService;
use App\Services\Cache\RecommendationCacheService;
use App\Models\EventPackage;
use App\Models\Recommendation;
use App\Models\Client;
use App\Models\ContactInquiry;
use App\Services\PreferenceSummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RecommendationController extends Controller
{
    protected $recommendationService;
    protected $preferenceSummaryService;
    protected $cacheService;

    public function __construct(
        RecommendationService $recommendationService,
        PreferenceSummaryService $preferenceSummaryService,
        RecommendationCacheService $cacheService
    ) {
        $this->recommendationService = $recommendationService;
        $this->preferenceSummaryService = $preferenceSummaryService;
        $this->cacheService = $cacheService;
    }

    /**
     * Standard recommendation endpoint — accepts criteria, optionally uses AI.
     */
    public function recommend(Request $request)
    {
        $request->validate([
            'type' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'guests' => 'nullable|integer|min:1',
            'theme' => 'nullable|string',
            'preferences' => 'nullable|array',
            'use_ai' => 'nullable|boolean',
            // Fields from Set An Event form
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_number' => 'nullable|string|max:20',
            'event_date' => 'nullable|date',
            'event_time' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
        ]);

        $useAI = $request->boolean('use_ai', false);

        // Get packages - filter by event type if provided
        $eventType = $request->input('type');
        $exactMatchFound = false;
        $fallbackUsed = false;
        $availableCategories = EventPackage::distinct()->pluck('package_category')->toArray();
        
        if ($eventType) {
            $packages = EventPackage::where('package_category', $eventType)->get();
            if ($packages->isEmpty()) {
                // No packages for requested type - use fallback
                $packages = EventPackage::all();
                $fallbackUsed = true;
            } else {
                $exactMatchFound = true;
            }
        } else {
            $packages = EventPackage::all();
        }

        $criteria = [
            'type' => $eventType,
            'budget' => $request->input('budget'),
            'guests' => $request->input('guests'),
            'theme' => $request->input('theme'),
            'preferences' => $request->input('preferences', []),
        ];

        // Try to get from cache first (only for non-AI requests; AI requests bypass cache)
        $cachedResults = null;
        $scoredPackages = null;

        if (!$useAI) {
            $cachedResults = $this->cacheService->get($criteria);
        }

        if ($cachedResults !== null) {
            $results = collect($cachedResults);
        } else {
            $scoredPackages = $this->recommendationService->scorePackages($packages, $criteria, $useAI);
            $results = $this->recommendationService->formatResults($scoredPackages, 5);
            
            if (!$useAI) {
                $this->cacheService->put($criteria, $results->toArray());
            }
        }

        // Save contact inquiry if submitted from Set An Event form
        if ($request->filled('first_name') && $request->filled('last_name') && $request->filled('email')) {
            try {
                $budget = $request->input('budget');
                $guests = $request->input('guests');
                $theme = $request->input('theme');
                $type = $request->input('type');

                $inquiryMessage = "Event Inquiry from Set An Event form.\n\n";
                $inquiryMessage .= "Event Date: " . ($request->event_date ?? 'Not specified') . "\n";
                $inquiryMessage .= "Event Time: " . ($request->event_time ?? 'Not specified') . "\n";
                $inquiryMessage .= "Preferred Venue: " . ($request->venue ?? 'Not specified') . "\n";
                $inquiryMessage .= "Guest Count: " . ($guests ?? 'Not specified') . "\n";
                $inquiryMessage .= "Budget: " . ($budget ? '₱' . number_format($budget, 2) : 'Not specified') . "\n";
                $inquiryMessage .= "Motifs/Themes: " . ($theme ?? 'Not specified') . "\n\n";
                $inquiryMessage .= "User is interested in the recommended packages.";

                ContactInquiry::create([
                    'name' => trim($request->first_name . ' ' . $request->last_name),
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'email' => $request->email,
                    'mobile_number' => $request->phone_number,
                    'event_type' => $type ?? 'other',
                    'date_of_event' => $request->event_date,
                    'preferred_venue' => $request->venue,
                    'budget' => $budget,
                    'estimated_guests' => $guests,
                    'message' => $inquiryMessage,
                    'status' => 'new',
                ]);
            } catch (\Exception $e) {
                Log::error('Error saving contact inquiry from recommendations: ' . $e->getMessage());
            }
        }

        // Persist recommendations and preferences (authenticated users only)
        if ($request->user()) {
            $client = Client::where('client_email', $request->user()->email)->first();
            if ($client) {
                if ($scoredPackages === null) {
                    $scoredPackages = $this->recommendationService->scorePackages($packages, $criteria);
                }
                
                foreach ($scoredPackages->take(5) as $item) {
                    Recommendation::create([
                        'client_id' => $client->client_id,
                        'package_id' => $item['package']->package_id,
                        'score' => $item['score'],
                        'reason' => $item['justification'],
                    ]);
                }

                if ($request->filled('type') || $request->filled('budget') || $request->filled('theme') || $request->filled('guests')) {
                    try {
                        $this->preferenceSummaryService->storePreferences(
                            $client,
                            [
                                'type' => $request->input('type'),
                                'budget' => $request->input('budget'),
                                'theme' => $request->input('theme'),
                                'guests' => $request->input('guests'),
                                'venue' => $request->input('venue'),
                                'preferences' => $request->input('preferences', []),
                            ],
                            $request->user()->id
                        );
                    } catch (\Exception $e) {
                        Log::error('Error saving preferences from recommendations: ' . $e->getMessage());
                    }
                }
            }
        }

        // Build response message based on match status
        $message = 'Top 5 packages based on your criteria';
        if ($fallbackUsed && $eventType) {
            $message = "No {$eventType} packages available. Showing alternative packages that might interest you.";
        } elseif ($exactMatchFound) {
            $message = "Found packages matching your {$eventType} event!";
        }

        return response()->json([
            'data' => $results,
            'message' => $message,
            'ai_enhanced' => $useAI,
            'exact_match' => $exactMatchFound,
            'fallback_used' => $fallbackUsed,
            'requested_type' => $eventType,
            'available_categories' => $availableCategories,
        ]);
    }

    /**
     * Personalized recommendations for authenticated users.
     * Auto-fills criteria from stored preferences + booking history, then
     * runs the full scoring pipeline including AI.
     */
    public function personalized(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Authentication required'], 401);
        }

        $client = Client::where('client_email', $user->email)->first();
        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }

        // Start with empty criteria — preferences fill it in
        $criteria = [
            'type' => $request->input('type'),
            'budget' => $request->input('budget'),
            'guests' => $request->input('guests'),
            'theme' => $request->input('theme'),
            'preferences' => $request->input('preferences', []),
        ];

        // Enrich missing fields from stored preferences / booking history
        $criteria = $this->recommendationService->enrichCriteriaWithPreferences($criteria, $client);

        // Also try to generate a fresh summary from booking history
        try {
            $historySummary = $this->preferenceSummaryService->generateSummary($client);
            if ($historySummary) {
                // Fill remaining gaps with history-generated data
                if (empty($criteria['type']) && !empty($historySummary['preferred_event_type'])) {
                    $criteria['type'] = $historySummary['preferred_event_type'];
                    $criteria['_enriched'][] = 'type (history)';
                }
                if (empty($criteria['budget']) && !empty($historySummary['preferred_budget'])) {
                    $criteria['budget'] = $historySummary['preferred_budget'];
                    $criteria['_enriched'][] = 'budget (history)';
                }
                if (empty($criteria['theme']) && !empty($historySummary['preferred_themes'])) {
                    $themes = is_array($historySummary['preferred_themes']) 
                        ? implode(', ', $historySummary['preferred_themes']) 
                        : $historySummary['preferred_themes'];
                    $criteria['theme'] = $themes;
                    $criteria['_enriched'][] = 'theme (history)';
                }
            }
        } catch (\Exception $e) {
            Log::warning('Could not generate preference summary: ' . $e->getMessage());
        }

        // Get all packages (no type filter — let the scoring rank everything)
        $packages = EventPackage::all();

        // Always use AI for personalized recommendations
        $scoredPackages = $this->recommendationService->scorePackages($packages, $criteria, true);
        $results = $this->recommendationService->formatResults($scoredPackages, 6);

        // Save updated recommendations
        foreach ($scoredPackages->take(6) as $item) {
            Recommendation::updateOrCreate(
                [
                    'client_id' => $client->client_id,
                    'package_id' => $item['package']->package_id,
                ],
                [
                    'score' => $item['score'],
                    'reason' => $item['justification'],
                ]
            );
        }

        return response()->json([
            'data' => $results,
            'message' => 'Personalized recommendations based on your history and preferences',
            'ai_enhanced' => true,
            'personalized' => true,
            'enriched_fields' => $criteria['_enriched'] ?? [],
        ]);
    }
}
