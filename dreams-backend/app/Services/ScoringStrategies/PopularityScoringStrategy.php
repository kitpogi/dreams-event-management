<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;
use App\Models\BookingDetail;
use App\Models\Review;
use Illuminate\Support\Facades\Cache;

class PopularityScoringStrategy implements ScoringStrategyInterface
{
    /**
     * Score packages based on booking popularity and review ratings.
     * Cached for 1 hour since booking/review data doesn't change rapidly.
     */
    public function score(EventPackage $package, array $criteria): array
    {
        $stats = $this->getPackageStats($package->package_id);

        $score = 0;
        $justifications = [];

        // Booking popularity: up to 15 points
        $bookingCount = $stats['booking_count'];
        if ($bookingCount >= 10) {
            $score += 15;
            $justifications[] = "Very popular ({$bookingCount} bookings, +15)";
        } elseif ($bookingCount >= 5) {
            $score += 10;
            $justifications[] = "Popular ({$bookingCount} bookings, +10)";
        } elseif ($bookingCount >= 2) {
            $score += 5;
            $justifications[] = "Booked {$bookingCount} times (+5)";
        }

        // Review rating: up to 10 points
        $avgRating = $stats['avg_rating'];
        $reviewCount = $stats['review_count'];
        if ($reviewCount >= 2 && $avgRating >= 4.5) {
            $score += 10;
            $justifications[] = "Highly rated ({$avgRating}★, +10)";
        } elseif ($reviewCount >= 1 && $avgRating >= 3.5) {
            $score += 6;
            $justifications[] = "Well rated ({$avgRating}★, +6)";
        } elseif ($reviewCount >= 1 && $avgRating >= 2.5) {
            $score += 3;
            $justifications[] = "Rated {$avgRating}★ (+3)";
        }

        return [
            'score' => $score,
            'justification' => implode(', ', $justifications),
        ];
    }

    protected function getPackageStats(int $packageId): array
    {
        return Cache::remember("pkg_stats_{$packageId}", 3600, function () use ($packageId) {
            $bookingCount = BookingDetail::where('package_id', $packageId)->count();

            $reviews = Review::where('package_id', $packageId);
            $reviewCount = $reviews->count();
            $avgRating = $reviewCount > 0 ? round($reviews->avg('rating'), 1) : 0;

            return [
                'booking_count' => $bookingCount,
                'review_count' => $reviewCount,
                'avg_rating' => $avgRating,
            ];
        });
    }
}
