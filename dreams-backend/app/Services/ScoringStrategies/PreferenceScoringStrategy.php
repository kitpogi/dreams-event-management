<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class PreferenceScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on preference keyword matching
     * +5 points for each preference keyword match
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $preferences = $criteria['preferences'] ?? [];
        $score = 0;
        $justification = '';

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
                $score = $preferenceScore;
                $justification = "{$matchedPreferences} preference match(es) (+{$preferenceScore})";
            }
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

