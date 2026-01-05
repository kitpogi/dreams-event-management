<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class BudgetScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on budget match
     * +30 points if within budget
     * +10 points if slightly over budget (up to 20% over)
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $budget = $criteria['budget'] ?? null;
        $score = 0;
        $justification = '';

        if ($budget && $budget > 0 && $package->package_price) {
            if ($package->package_price <= $budget) {
                $score = 30;
                $justification = "Within budget (+30)";
            } elseif ($package->package_price <= $budget * 1.2) {
                $score = 10;
                $justification = "Slightly over budget (+10)";
            }
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

