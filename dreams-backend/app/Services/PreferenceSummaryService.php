<?php

namespace App\Services;

use App\Models\EventPreference;
use App\Models\Client;
use App\Models\BookingDetail;
use Illuminate\Support\Collection;

class PreferenceSummaryService
{
    /**
     * Generate a summary of client preferences
     */
    public function generateSummary(Client $client): array
    {
        $preference = EventPreference::where('client_id', $client->client_id)->first();
        $bookings = BookingDetail::where('client_id', $client->client_id)
            ->with('eventPackage')
            ->get();

        $summary = [
            'client_id' => $client->client_id,
            'stored_preferences' => null,
            'booking_history_summary' => $this->analyzeBookingHistory($bookings),
            'preferred_event_types' => [],
            'average_budget' => null,
            'common_themes' => [],
            'average_guest_count' => null,
            'preferred_venues' => [],
        ];

        // If preferences exist, include them
        if ($preference) {
            $summary['stored_preferences'] = [
                'event_type' => $preference->preferred_event_type,
                'budget' => $preference->preferred_budget,
                'theme' => $preference->preferred_theme,
                'guest_count' => $preference->preferred_guest_count,
                'venue' => $preference->preferred_venue,
                'preferences' => $preference->preferences,
            ];
        }

        // Analyze booking history
        if ($bookings->isNotEmpty()) {
            $summary['preferred_event_types'] = $bookings->pluck('eventPackage.package_category')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            $summary['average_budget'] = $bookings->pluck('eventPackage.package_price')
                ->filter()
                ->avg();

            $summary['average_guest_count'] = $bookings->pluck('guest_count')
                ->filter()
                ->avg();

            $summary['preferred_venues'] = $bookings->pluck('event_venue')
                ->filter()
                ->unique()
                ->values()
                ->toArray();
        }

        return $summary;
    }

    /**
     * Analyze booking history to extract preferences
     */
    protected function analyzeBookingHistory(Collection $bookings): array
    {
        if ($bookings->isEmpty()) {
            return [
                'total_bookings' => 0,
                'completed_bookings' => 0,
                'most_booked_category' => null,
                'most_used_venue' => null,
            ];
        }

        $completedBookings = $bookings->where('booking_status', 'Completed');

        $categories = $bookings->pluck('eventPackage.package_category')
            ->filter()
            ->countBy()
            ->sortDesc();

        $venues = $bookings->pluck('event_venue')
            ->filter()
            ->countBy()
            ->sortDesc();

        return [
            'total_bookings' => $bookings->count(),
            'completed_bookings' => $completedBookings->count(),
            'most_booked_category' => $categories->keys()->first(),
            'most_used_venue' => $venues->keys()->first(),
            'booking_trends' => [
                'categories' => $categories->take(3)->toArray(),
                'venues' => $venues->take(3)->toArray(),
            ],
        ];
    }

    /**
     * Store or update client preferences
     */
    public function storePreferences(Client $client, array $preferenceData, ?int $userId = null): EventPreference
    {
        return EventPreference::updateOrCreate(
            ['client_id' => $client->client_id],
            [
                'user_id' => $userId,
                'preferred_event_type' => $preferenceData['type'] ?? null,
                'preferred_budget' => $preferenceData['budget'] ?? null,
                'preferred_theme' => $preferenceData['theme'] ?? null,
                'preferred_guest_count' => $preferenceData['guests'] ?? null,
                'preferred_venue' => $preferenceData['venue'] ?? null,
                'preferences' => $preferenceData['preferences'] ?? [],
            ]
        );
    }
}

