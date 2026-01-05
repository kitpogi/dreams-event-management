<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

interface ScoringStrategyInterface
{
    /**
     * Calculate the score for a package based on the given criteria
     *
     * @param EventPackage $package The package to score
     * @param array $criteria The scoring criteria
     * @return array ['score' => int, 'justification' => string]
     */
    public function score(EventPackage $package, array $criteria): array;
}

