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

            // Guest capacity scoring
            if ($guests && $guests > 0 && $package->capacity) {
                $packageCapacity = (int) $package->capacity;
                $guestCount = (int) $guests;
                
                if ($packageCapacity >= $guestCount) {
                    // Perfect match or can accommodate
                    if ($packageCapacity <= $guestCount * 1.2) {
                        // Within 20% of capacity - perfect fit
                        $score += 25;
                        $justification[] = "Perfect capacity match (+25)";
                    } elseif ($packageCapacity <= $guestCount * 1.5) {
                        // Within 50% - good fit
                        $score += 15;
                        $justification[] = "Good capacity match (+15)";
                    } else {
                        // Can accommodate but larger
                        $score += 5;
                        $justification[] = "Can accommodate guests (+5)";
                    }
                } else {
                    // Package capacity is less than required guests
                    // Don't add points, but don't penalize heavily (might still be suitable with adjustments)
                }
            }

            // Theme/motif matching (can be comma-separated list)
            if ($theme) {
                $themes = array_map('trim', explode(',', $theme));
                $packageDescription = strtolower($package->package_description ?? '');
                $packageName = strtolower($package->package_name ?? '');
                $matchedThemes = 0;
                
                foreach ($themes as $themeItem) {
                    $themeLower = strtolower(trim($themeItem));
                    if (!empty($themeLower)) {
                        if (strpos($packageDescription, $themeLower) !== false || 
                            strpos($packageName, $themeLower) !== false) {
                            $matchedThemes++;
                        }
                    }
                }
                
                if ($matchedThemes > 0) {
                    // Score based on number of matched themes
                    // +15 for first match, +5 for each additional match (max +25)
                    $themeScore = 15 + (($matchedThemes - 1) * 5);
                    $themeScore = min($themeScore, 25); // Cap at 25 points
                    $score += $themeScore;
                    $justification[] = "{$matchedThemes} motif/theme match(es) (+{$themeScore})";
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
        // Find the maximum score for normalization
        $maxScore = $scoredPackages->max('score') ?? 100;
        // If max score is 0, set to 100 to avoid division by zero
        if ($maxScore == 0) {
            $maxScore = 100;
        }

        return $scoredPackages->take($limit)->values()->map(function ($item) use ($maxScore) {
            // Normalize score to 0-1 range (frontend expects this and multiplies by 100 for percentage)
            $normalizedScore = $item['score'] / $maxScore;
            // Ensure it's between 0 and 1
            $normalizedScore = max(0, min(1, $normalizedScore));
            
            return [
                'id' => $item['package']->package_id,
                'name' => $item['package']->package_name,
                'description' => $item['package']->package_description,
                'price' => $item['package']->package_price,
                'capacity' => $item['package']->capacity,
                'package_image' => $item['package']->package_image,
                'score' => $normalizedScore, // Normalized 0-1 range
                'match_score' => $normalizedScore, // Alias for compatibility
                'raw_score' => $item['score'], // Keep raw score for reference
                'justification' => $item['justification'],
            ];
        });
    }
}

