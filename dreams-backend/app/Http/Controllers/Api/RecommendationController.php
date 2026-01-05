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

    public function recommend(Request $request)
    {
        $request->validate([
            'type' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'guests' => 'nullable|integer|min:1',
            'theme' => 'nullable|string',
            'preferences' => 'nullable|array',
            // Fields from Set An Event form
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_number' => 'nullable|string|max:20',
            'event_date' => 'nullable|date',
            'event_time' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
        ]);

        // Get packages - filter by event type if provided
        $eventType = $request->input('type');
        if ($eventType) {
            $packages = EventPackage::where('package_category', $eventType)->get();
            // If no packages found for the specific type, fall back to all packages
            if ($packages->isEmpty()) {
                $packages = EventPackage::all();
            }
        } else {
            $packages = EventPackage::all();
        }

        // Score packages using service
        $criteria = [
            'type' => $eventType,
            'budget' => $request->input('budget'),
            'guests' => $request->input('guests'),
            'theme' => $request->input('theme'),
            'preferences' => $request->input('preferences', []),
        ];

        // Try to get from cache first
        $cachedResults = $this->cacheService->get($criteria);
        
        if ($cachedResults !== null) {
            // Cache hit - return cached results
            $results = collect($cachedResults);
            // Still need to score packages for saving to database (if user is authenticated)
            // But we can skip the expensive scoring if not needed
            $scoredPackages = null; // Will be calculated only if needed for saving
        } else {
            // Cache miss - calculate recommendations
            $scoredPackages = $this->recommendationService->scorePackages($packages, $criteria);
            $results = $this->recommendationService->formatResults($scoredPackages, 5);
            
            // Store in cache for future requests (convert to array for storage)
            $this->cacheService->put($criteria, $results->toArray());
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
                // Don't fail the request if inquiry save fails
            }
        }

        // Persist recommendations and preferences (only if user is authenticated)
        if ($request->user()) {
            $client = Client::where('client_email', $request->user()->email)->first();
            if ($client) {
                // If we used cache, we need to score packages for saving to database
                if ($scoredPackages === null) {
                    $scoredPackages = $this->recommendationService->scorePackages($packages, $criteria);
                }
                
                // Save recommendations
                foreach ($scoredPackages->take(5) as $item) {
                    Recommendation::create([
                        'client_id' => $client->client_id,
                        'package_id' => $item['package']->package_id,
                        'score' => $item['score'],
                        'reason' => $item['justification'],
                    ]);
                }

                // Save preferences if provided
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
                        // Don't fail the request if preference save fails
                    }
                }
            }
        }

        return response()->json([
            'data' => $results,
            'message' => 'Top 5 packages based on your criteria',
        ]);
    }
}
