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
    
    /**
     * Strategy weights - higher weight = more important
     * Budget is most important (1.5x), then Category (1.2x), Capacity (1.0x), Theme (0.8x), Preferences (0.5x)
     */
    protected $weights = [
        CategoryScoringStrategy::class => 1.2,  // Event type is very important
        BudgetScoringStrategy::class => 1.5,     // Budget is MOST important
        CapacityScoringStrategy::class => 1.0,   // Capacity is important
        ThemeScoringStrategy::class => 0.8,       // Theme is less important than budget
        PreferenceScoringStrategy::class => 0.5,  // Preferences are nice-to-have
    ];

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
     * Score packages based on criteria using scoring strategies with weighting
     */
    public function scorePackages($packages, $criteria)
    {
        return $packages->map(function ($package) use ($criteria) {
            $totalScore = 0;
            $justifications = [];
            $scoreBreakdown = []; // Track individual scores for debugging

            // Apply each scoring strategy with its weight
            foreach ($this->strategies as $strategy) {
                $result = $strategy->score($package, $criteria);
                $strategyClass = get_class($strategy);
                $weight = $this->weights[$strategyClass] ?? 1.0;
                
                // Apply weight to the score
                $weightedScore = $result['score'] * $weight;
                $totalScore += $weightedScore;
                
                // Store breakdown for transparency
                $scoreBreakdown[$strategyClass] = [
                    'raw' => $result['score'],
                    'weight' => $weight,
                    'weighted' => $weightedScore,
                ];
                
                if (!empty($result['justification'])) {
                    // Include weight info in justification if weight != 1.0
                    $justification = $result['justification'];
                    if ($weight != 1.0) {
                        $justification .= sprintf(' (weighted: %.1fx)', $weight);
                    }
                    $justifications[] = $justification;
                }
            }

            return [
                'package' => $package,
                'score' => round($totalScore, 2), // Round to 2 decimal places
                'justification' => implode(', ', $justifications) ?: 'No matches found',
                'score_breakdown' => $scoreBreakdown, // Include for debugging/transparency
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

