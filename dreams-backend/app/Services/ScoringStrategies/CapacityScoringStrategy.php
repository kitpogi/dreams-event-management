<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;

class CapacityScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score based on guest capacity match
     * +25 points for perfect capacity match (within 20%)
     * +15 points for good capacity match (within 50%)
     * +5 points if can accommodate but larger
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $guests = $criteria['guests'] ?? null;
        $score = 0;
        $justification = '';

        if ($guests && $guests > 0 && $package->capacity) {
            $packageCapacity = (int) $package->capacity;
            $guestCount = (int) $guests;
            
            if ($packageCapacity >= $guestCount) {
                // Perfect match or can accommodate
                if ($packageCapacity <= $guestCount * 1.2) {
                    // Within 20% of capacity - perfect fit
                    $score = 25;
                    $justification = "Perfect capacity match (+25)";
                } elseif ($packageCapacity <= $guestCount * 1.5) {
                    // Within 50% - good fit
                    $score = 15;
                    $justification = "Good capacity match (+15)";
                } else {
                    // Can accommodate but larger
                    $score = 5;
                    $justification = "Can accommodate guests (+5)";
                }
            }
            // If package capacity is less than required guests, don't add points
            // (might still be suitable with adjustments, but no bonus)
        }

        return [
            'score' => $score,
            'justification' => $justification,
        ];
    }
}

