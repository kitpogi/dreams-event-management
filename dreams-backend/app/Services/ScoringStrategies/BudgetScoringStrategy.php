<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class BudgetScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on budget match
     * +40 points if within budget (increased importance)
     * +20 points if slightly over budget (up to 15% over)
     * +5 points if moderately over budget (15-25% over)
     * Note: With 1.5x weight, these become +60, +30, and +7.5 respectively
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $budget = $criteria['budget'] ?? null;
        $score = 0;
        $justification = '';

        if ($budget && $budget > 0 && $package->package_price) {
            $priceRatio = $package->package_price / $budget;
            
            if ($priceRatio <= 1.0) {
                // Within budget - highest score
                $score = 40;
                $justification = "Within budget (+40)";
            } elseif ($priceRatio <= 1.15) {
                // Slightly over budget (up to 15% over)
                $score = 20;
                $justification = "Slightly over budget (+20)";
            } elseif ($priceRatio <= 1.25) {
                // Moderately over budget (15-25% over)
                $score = 5;
                $justification = "Moderately over budget (+5)";
            }
            // If more than 25% over budget, no points (too expensive)
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

