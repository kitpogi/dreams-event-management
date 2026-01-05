<?php

namespace App\Services;

use App\Models\EventPackage;
use App\Services\ScoringStrategies\CategoryScoringStrategy;
use App\Services\ScoringStrategies\BudgetScoringStrategy;
use App\Services\ScoringStrategies\CapacityScoringStrategy;
use App\Services\ScoringStrategies\ThemeScoringStrategy;
use App\Services\ScoringStrategies\PreferenceScoringStrategy;

class RecommendationService
{
    protected $strategies;

    public function __construct()
    {
        // Initialize all scoring strategies
        $this->strategies = [
            new CategoryScoringStrategy(),
            new BudgetScoringStrategy(),
            new CapacityScoringStrategy(),
            new ThemeScoringStrategy(),
            new PreferenceScoringStrategy(),
        ];
    }

    /**
     * Score packages based on criteria using scoring strategies
     */
    public function scorePackages($packages, $criteria)
    {
        return $packages->map(function ($package) use ($criteria) {
            $totalScore = 0;
            $justifications = [];

            // Apply each scoring strategy
            foreach ($this->strategies as $strategy) {
                $result = $strategy->score($package, $criteria);
                $totalScore += $result['score'];
                
                if (!empty($result['justification'])) {
                    $justifications[] = $result['justification'];
                }
            }

            return [
                'package' => $package,
                'score' => $totalScore,
                'justification' => implode(', ', $justifications) ?: 'No matches found',
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
                'category' => $item['package']->package_category, // Include category for filtering
                'package_category' => $item['package']->package_category, // Alias for compatibility
                'score' => $normalizedScore, // Normalized 0-1 range
                'match_score' => $normalizedScore, // Alias for compatibility
                'raw_score' => $item['score'], // Keep raw score for reference
                'justification' => $item['justification'],
            ];
        });
    }
}

