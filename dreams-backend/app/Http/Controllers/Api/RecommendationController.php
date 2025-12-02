<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventPackage;
use App\Models\RecommendationLog;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function recommend(Request $request)
    {
        $request->validate([
            'type' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'guests' => 'nullable|integer|min:1',
            'theme' => 'nullable|string',
            'preferences' => 'nullable|array',
        ]);

        $type = $request->input('type');
        $budget = $request->input('budget');
        $guests = $request->input('guests');
        $theme = $request->input('theme');
        $preferences = $request->input('preferences', []);

        // Get all packages with relationships
        $packages = EventPackage::with(['venue', 'images'])->get();

        // Score each package
        $scoredPackages = $packages->map(function ($package) use ($type, $budget, $guests, $theme, $preferences) {
            $score = 0;
            $justification = [];

            // +40 for type match
            if ($type && $package->type === $type) {
                $score += 40;
                $justification[] = "Type match (+40)";
            }

            // +20 if within 20% of budget
            if ($budget && $budget > 0 && $package->price) {
                $priceDiff = abs($package->price - $budget) / $budget;
                if ($priceDiff <= 0.2) {
                    $score += 20;
                    $justification[] = "Within 20% of budget (+20)";
                }
            }

            // +10 if capacity >= guests
            if ($guests && $package->capacity >= $guests) {
                $score += 10;
                $justification[] = "Capacity sufficient (+10)";
            }

            // +10 for theme match
            if ($theme && $package->theme === $theme) {
                $score += 10;
                $justification[] = "Theme match (+10)";
            }

            // +5 for each preference keyword match
            if (!empty($preferences) && is_array($preferences)) {
                $packageDescription = strtolower($package->description ?? '');
                $packageName = strtolower($package->name ?? '');
                $matchedPreferences = 0;

                foreach ($preferences as $preference) {
                    $prefLower = strtolower($preference);
                    if (strpos($packageDescription, $prefLower) !== false || 
                        strpos($packageName, $prefLower) !== false) {
                        $matchedPreferences++;
                    }
                }

                if ($matchedPreferences > 0) {
                    $preferenceScore = $matchedPreferences * 5;
                    $score += $preferenceScore;
                    $justification[] = "{$matchedPreferences} preference match(es) (+{$preferenceScore})";
                }
            }

            return [
                'package' => $package,
                'score' => $score,
                'justification' => implode(', ', $justification) ?: 'No matches found',
            ];
        })->sortByDesc('score')->take(5)->values();

        // Format results
        $results = $scoredPackages->map(function ($item) {
            return [
                'id' => $item['package']->id,
                'name' => $item['package']->name,
                'description' => $item['package']->description,
                'price' => $item['package']->price,
                'capacity' => $item['package']->capacity,
                'venue' => $item['package']->venue,
                'images' => $item['package']->images,
                'score' => $item['score'],
                'justification' => $item['justification'],
            ];
        });

        // Log the recommendation
        RecommendationLog::create([
            'user_id' => $request->user()->id,
            'type' => $type,
            'budget' => $budget,
            'guests' => $guests,
            'theme' => $theme,
            'preferences' => $preferences,
            'results' => $results->toArray(),
        ]);

        return response()->json([
            'data' => $results,
            'message' => 'Top 5 packages based on your criteria',
        ]);
    }
}
