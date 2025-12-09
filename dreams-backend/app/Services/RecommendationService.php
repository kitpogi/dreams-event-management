<?php

namespace App\Services;

use App\Models\EventPackage;

class RecommendationService
{
    /**
     * Score packages based on criteria
     */
    public function scorePackages($packages, $criteria)
    {
        $type = $criteria['type'] ?? null;
        $budget = $criteria['budget'] ?? null;
        $guests = $criteria['guests'] ?? null;
        $theme = $criteria['theme'] ?? null;
        $preferences = $criteria['preferences'] ?? [];

        return $packages->map(function ($package) use ($type, $budget, $guests, $theme, $preferences) {
            $score = 0;
            $justification = [];

            // +40 for category/type match
            if ($type && $package->package_category === $type) {
                $score += 40;
                $justification[] = "Type match (+40)";
            }

            // Budget scoring
            if ($budget && $budget > 0 && $package->package_price) {
                if ($package->package_price <= $budget) {
                    $score += 30;
                    $justification[] = "Within budget (+30)";
                } elseif ($package->package_price <= $budget * 1.2) {
                    $score += 10;
                    $justification[] = "Slightly over budget (+10)";
                }
            }

            // +15 for theme match (searching in description/name)
            if ($theme) {
                $themeLower = strtolower($theme);
                $packageDescription = strtolower($package->package_description ?? '');
                $packageName = strtolower($package->package_name ?? '');
                
                if (strpos($packageDescription, $themeLower) !== false || 
                    strpos($packageName, $themeLower) !== false) {
                    $score += 15;
                    $justification[] = "Theme match (+15)";
                }
            }

            // +5 for each preference keyword match
            if (!empty($preferences) && is_array($preferences)) {
                $packageDescription = strtolower($package->package_description ?? '');
                $packageName = strtolower($package->package_name ?? '');
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
        })->sortByDesc('score');
    }

    /**
     * Format recommendation results
     */
    public function formatResults($scoredPackages, $limit = 5)
    {
        return $scoredPackages->take($limit)->values()->map(function ($item) {
            return [
                'id' => $item['package']->package_id,
                'name' => $item['package']->package_name,
                'description' => $item['package']->package_description,
                'price' => $item['package']->package_price,
                'score' => $item['score'],
                'justification' => $item['justification'],
            ];
        });
    }
}

