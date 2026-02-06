<?php

namespace App\Services;

use App\Models\EventPackage;
use App\Models\EventPreference;
use App\Models\Client;
use App\Services\AI\GeminiService;
use App\Services\ScoringStrategies\CategoryScoringStrategy;
use App\Services\ScoringStrategies\BudgetScoringStrategy;
use App\Services\ScoringStrategies\CapacityScoringStrategy;
use App\Services\ScoringStrategies\ThemeScoringStrategy;
use App\Services\ScoringStrategies\PreferenceScoringStrategy;
use App\Services\ScoringStrategies\PopularityScoringStrategy;
use App\Services\ScoringStrategies\AIScoringStrategy;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    protected $strategies;
    protected $aiStrategy;
    protected $enableAI;
    
    /**
     * Strategy weights - higher weight = more important
     */
    protected $weights = [
        CategoryScoringStrategy::class => 1.2,      // Event type match
        BudgetScoringStrategy::class => 1.5,         // Budget is MOST important
        CapacityScoringStrategy::class => 1.0,       // Capacity fit
        ThemeScoringStrategy::class => 0.8,          // Theme keywords
        PreferenceScoringStrategy::class => 0.5,     // Preference keywords
        PopularityScoringStrategy::class => 0.6,     // Booking popularity & ratings
        AIScoringStrategy::class => 1.0,             // Gemini AI semantic analysis
    ];

    public function __construct(GeminiService $gemini)
    {
        $this->aiStrategy = new AIScoringStrategy($gemini);
        $this->enableAI = $gemini->isAvailable();

        // Core rule-based strategies (always active)
        $this->strategies = [
            new CategoryScoringStrategy(),
            new BudgetScoringStrategy(),
            new CapacityScoringStrategy(),
            new ThemeScoringStrategy(),
            new PreferenceScoringStrategy(),
            new PopularityScoringStrategy(),
        ];
    }

    /**
     * Merge stored user preferences into the criteria.
     * Stored preferences fill in missing fields — explicit input always takes priority.
     */
    public function enrichCriteriaWithPreferences(array $criteria, ?Client $client): array
    {
        if (!$client) {
            return $criteria;
        }

        $preference = EventPreference::where('client_id', $client->client_id)->first();
        
        if (!$preference) {
            return $criteria;
        }

        // Only fill in missing criteria — user's explicit input always wins
        if (empty($criteria['type']) && $preference->preferred_event_type) {
            $criteria['type'] = $preference->preferred_event_type;
            $criteria['_enriched'][] = 'type';
        }

        if (empty($criteria['budget']) && $preference->preferred_budget) {
            $criteria['budget'] = $preference->preferred_budget;
            $criteria['_enriched'][] = 'budget';
        }

        if (empty($criteria['guests']) && $preference->preferred_guest_count) {
            $criteria['guests'] = $preference->preferred_guest_count;
            $criteria['_enriched'][] = 'guests';
        }

        if (empty($criteria['theme']) && $preference->preferred_theme) {
            $criteria['theme'] = $preference->preferred_theme;
            $criteria['_enriched'][] = 'theme';
        }

        if (empty($criteria['preferences']) && $preference->preferences) {
            $criteria['preferences'] = is_array($preference->preferences) 
                ? $preference->preferences 
                : json_decode($preference->preferences, true) ?? [];
            $criteria['_enriched'][] = 'preferences';
        }

        return $criteria;
    }

    /**
     * Score packages based on criteria using scoring strategies with weighting
     */
    public function scorePackages($packages, $criteria, bool $useAI = false)
    {
        return $packages->map(function ($package) use ($criteria, $useAI) {
            $totalScore = 0;
            $justifications = [];
            $scoreBreakdown = [];
            $aiInsight = null;

            // Apply each rule-based scoring strategy with its weight
            foreach ($this->strategies as $strategy) {
                $result = $strategy->score($package, $criteria);
                $strategyClass = get_class($strategy);
                $weight = $this->weights[$strategyClass] ?? 1.0;
                
                $weightedScore = $result['score'] * $weight;
                $totalScore += $weightedScore;
                
                $scoreBreakdown[$strategyClass] = [
                    'raw' => $result['score'],
                    'weight' => $weight,
                    'weighted' => $weightedScore,
                ];
                
                if (!empty($result['justification'])) {
                    $justification = $result['justification'];
                    if ($weight != 1.0) {
                        $justification .= sprintf(' (weighted: %.1fx)', $weight);
                    }
                    $justifications[] = $justification;
                }
            }

            // Apply AI scoring if enabled and available
            if ($useAI && $this->enableAI) {
                try {
                    $aiResult = $this->aiStrategy->score($package, $criteria);
                    $weight = $this->weights[AIScoringStrategy::class] ?? 1.0;
                    $weightedScore = $aiResult['score'] * $weight;
                    $totalScore += $weightedScore;

                    $scoreBreakdown[AIScoringStrategy::class] = [
                        'raw' => $aiResult['score'],
                        'weight' => $weight,
                        'weighted' => $weightedScore,
                    ];

                    if (!empty($aiResult['justification'])) {
                        $justifications[] = $aiResult['justification'] . ' (AI)';
                        $aiInsight = $aiResult['justification'];
                    }
                } catch (\Exception $e) {
                    Log::warning('AI scoring failed for package ' . $package->package_id, [
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return [
                'package' => $package,
                'score' => round($totalScore, 2),
                'justification' => implode(', ', $justifications) ?: 'No matches found',
                'score_breakdown' => $scoreBreakdown,
                'ai_insight' => $aiInsight,
            ];
        })->sortByDesc('score');
    }

    /**
     * Format recommendation results
     */
    public function formatResults($scoredPackages, $limit = 5)
    {
        $maxScore = $scoredPackages->max('score') ?? 100;
        if ($maxScore == 0) {
            $maxScore = 100;
        }

        return $scoredPackages->take($limit)->values()->map(function ($item) use ($maxScore) {
            $normalizedScore = $item['score'] / $maxScore;
            $normalizedScore = max(0, min(1, $normalizedScore));
            
            $result = [
                'id' => $item['package']->package_id,
                'name' => $item['package']->package_name,
                'description' => $item['package']->package_description,
                'price' => $item['package']->package_price,
                'capacity' => $item['package']->capacity,
                'package_image' => $item['package']->package_image,
                'category' => $item['package']->package_category,
                'package_category' => $item['package']->package_category,
                'score' => $normalizedScore,
                'match_score' => $normalizedScore,
                'raw_score' => $item['score'],
                'justification' => $item['justification'],
            ];

            // Include AI insight when available
            if (!empty($item['ai_insight'])) {
                $result['ai_insight'] = $item['ai_insight'];
            }

            return $result;
        });
    }
}
