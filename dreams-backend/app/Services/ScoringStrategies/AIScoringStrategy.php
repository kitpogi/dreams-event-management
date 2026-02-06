<?php

namespace App\Services\ScoringStrategies;

use App\Models\EventPackage;
use App\Services\AI\GeminiService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIScoringStrategy implements ScoringStrategyInterface
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Use Gemini to semantically score how well a package matches user criteria.
     * Results are cached per package+criteria combination for 2 hours.
     */
    public function score(EventPackage $package, array $criteria): array
    {
        // If Gemini is not available, return neutral score
        if (!$this->gemini->isAvailable()) {
            return ['score' => 0, 'justification' => ''];
        }

        // Only run AI scoring if there's meaningful criteria to analyze
        $hasTheme = !empty($criteria['theme']);
        $hasPreferences = !empty($criteria['preferences']) && is_array($criteria['preferences']) && count($criteria['preferences']) > 0;
        
        if (!$hasTheme && !$hasPreferences) {
            return ['score' => 0, 'justification' => ''];
        }

        $cacheKey = 'ai_score_' . md5($package->package_id . json_encode([
            'theme' => $criteria['theme'] ?? '',
            'preferences' => $criteria['preferences'] ?? [],
            'type' => $criteria['type'] ?? '',
        ]));

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $result = $this->analyzeWithGemini($package, $criteria);
            
            // Cache for 2 hours
            Cache::put($cacheKey, $result, 7200);
            
            return $result;
        } catch (\Exception $e) {
            Log::warning('AIScoringStrategy: Gemini scoring failed', [
                'package_id' => $package->package_id,
                'error' => $e->getMessage(),
            ]);
            return ['score' => 0, 'justification' => ''];
        }
    }

    protected function analyzeWithGemini(EventPackage $package, array $criteria): array
    {
        $theme = $criteria['theme'] ?? 'not specified';
        $preferences = !empty($criteria['preferences']) ? implode(', ', $criteria['preferences']) : 'none';
        $eventType = $criteria['type'] ?? 'any event';

        $prompt = <<<PROMPT
You are an event planning expert. Analyze how well this event package matches the client's preferences.

EVENT PACKAGE:
- Name: {$package->package_name}
- Category: {$package->package_category}
- Description: {$package->package_description}
- Price: ₱{$package->package_price}
- Capacity: {$package->capacity} guests
- Inclusions: {$package->package_inclusions}

CLIENT PREFERENCES:
- Event Type: {$eventType}
- Theme/Motif: {$theme}
- Specific Preferences: {$preferences}

Rate the SEMANTIC match between the package and client preferences on a scale of 0-30.
Consider:
- How well the package theme/vibe matches the requested theme (0-15 points)
- How well the inclusions and description match the specific preferences (0-15 points)

Respond in this EXACT JSON format only:
{"score": <number 0-30>, "reason": "<one short sentence explaining the match>"}
PROMPT;

        $response = $this->gemini->generateJson($prompt, [
            'temperature' => 0.2,
            'max_tokens' => 150,
        ]);

        if (!$response || !isset($response['score'])) {
            return ['score' => 0, 'justification' => ''];
        }

        $score = max(0, min(30, (int) $response['score']));
        $reason = $response['reason'] ?? 'AI-analyzed match';

        return [
            'score' => $score,
            'justification' => "AI match: {$reason} (+{$score})",
        ];
    }
}
