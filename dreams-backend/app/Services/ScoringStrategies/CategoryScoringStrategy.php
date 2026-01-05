<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class CategoryScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on category/type match
     * +40 points for exact category match
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $type = $criteria['type'] ?? null;
        $score = 0;
        $justification = '';

        if ($type && $package->package_category === $type) {
            $score = 40;
            $justification = "Type match (+40)";
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

