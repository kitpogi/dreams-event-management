<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class ThemeScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on theme/motif matching
     * Supports comma-separated themes
     * +15 for first match, +5 for each additional match (max +25)
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $theme = $criteria['theme'] ?? null;
        $score = 0;
        $justification = '';

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
                $score = $themeScore;
                $justification = "{$matchedThemes} motif/theme match(es) (+{$themeScore})";
            }
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

